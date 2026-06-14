import type {
  CodeEncodeOptionsMap,
  CodeEncodeRequest,
  DotMatrix as CoreDotMatrix,
  DotValue,
  EncodableCodeType,
  SVGRenderOptions,
} from '@lolicode/core'
import { encode } from '@lolicode/core'

export type { SVGRenderOptions } from '@lolicode/core'

type DotMatrixData = DotValue[][]
type SVGCodeEncodeRequest<TType extends EncodableCodeType = EncodableCodeType> = CodeEncodeRequest<TType>

export type SVGInput = CoreDotMatrix | DotMatrixData | SVGCodeEncodeRequest

export type SVGCodeRenderOptions<TType extends EncodableCodeType = EncodableCodeType> = SVGRenderOptions & {
  type: TType
  encode?: CodeEncodeOptionsMap[TType]
}

function isCoreDotMatrix(input: SVGInput): input is CoreDotMatrix {
  return !Array.isArray(input) && 'data' in input && 'metadata' in input
}

function isCodeEncodeRequest(input: SVGInput): input is SVGCodeEncodeRequest {
  return !Array.isArray(input) && 'type' in input && 'content' in input
}

function resolveInput(input: SVGInput): CoreDotMatrix | DotMatrixData {
  return isCodeEncodeRequest(input) ? encode(input) : input
}

function getMatrixData(input: CoreDotMatrix | DotMatrixData): DotMatrixData {
  return isCoreDotMatrix(input) ? input.data : input
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be a positive number`)
}

function renderData(matrix: DotMatrixData, options: SVGRenderOptions = {}): string {
  const moduleSize = options.moduleSize ?? 4
  assertFinitePositive(moduleSize, 'moduleSize')

  const foreground = escapeAttribute(options.foreground ?? '#000000')
  const background = escapeAttribute(options.background ?? '#FFFFFF')
  const width = matrix.length > 0 ? matrix[0].length : 0
  const height = matrix.length
  const pixelWidth = width * moduleSize
  const pixelHeight = height * moduleSize
  const parts: string[] = []

  if (options.includeDeclaration)
    parts.push('<?xml version="1.0" encoding="UTF-8"?>')

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${pixelWidth}" height="${pixelHeight}" viewBox="0 0 ${pixelWidth} ${pixelHeight}" role="img" shape-rendering="crispEdges">`)
  parts.push(`<rect width="100%" height="100%" fill="${background}"/>`)

  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
    const row = matrix[rowIndex]
    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      if (row[columnIndex] === 1) {
        parts.push(`<rect x="${columnIndex * moduleSize}" y="${rowIndex * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${foreground}"/>`)
      }
    }
  }

  parts.push('</svg>')
  return parts.join('')
}

export function renderSVG<TType extends EncodableCodeType>(content: string, options: SVGCodeRenderOptions<TType>): string
export function renderSVG(input: SVGInput, options?: SVGRenderOptions): string
export function renderSVG<TType extends EncodableCodeType>(
  input: SVGInput | string,
  options?: SVGRenderOptions | SVGCodeRenderOptions<TType>,
): string {
  if (typeof input === 'string' && (options === undefined || !('type' in options))) {
    throw new Error('SVG code rendering requires a code type')
  }

  const resolved = typeof input === 'string'
    ? encode({
        type: (options as SVGCodeRenderOptions<TType>).type,
        content: input,
        options: (options as SVGCodeRenderOptions<TType>).encode,
      } as CodeEncodeRequest)
    : resolveInput(input)

  return renderData(getMatrixData(resolved), options)
}

export function renderDataURL<TType extends EncodableCodeType>(content: string, options: SVGCodeRenderOptions<TType>): string
export function renderDataURL(input: SVGInput, options?: SVGRenderOptions): string
export function renderDataURL<TType extends EncodableCodeType>(
  input: SVGInput | string,
  options?: SVGRenderOptions | SVGCodeRenderOptions<TType>,
): string {
  const svg = typeof input === 'string'
    ? renderSVG(input, options as SVGCodeRenderOptions<TType>)
    : renderSVG(input, options as SVGRenderOptions)

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
