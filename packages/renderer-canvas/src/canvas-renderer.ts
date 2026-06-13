import type {
  CodeEncodeOptionsMap,
  CodeEncodeRequest,
  CanvasRenderOptions as CoreCanvasRenderOptions,
  DotMatrix as CoreDotMatrix,
  DotValue,
  EncodableCodeType,
} from '@lolicode/core'
import { encode } from '@lolicode/core'

type DotMatrixData = DotValue[][]
type CanvasCodeEncodeRequest<TType extends EncodableCodeType = EncodableCodeType> = CodeEncodeRequest<TType>
type CanvasFillStyle = string | CanvasGradient | CanvasPattern

export interface Canvas2DContext {
  canvas?: {
    width: number
    height: number
  }
  fillStyle: CanvasFillStyle
  fillRect: (x: number, y: number, width: number, height: number) => void
  clearRect?: (x: number, y: number, width: number, height: number) => void
}

export interface CanvasElementTarget {
  width: number
  height: number
  getContext: (contextId: '2d') => Canvas2DContext | null
}

export type CanvasTarget = Canvas2DContext | CanvasElementTarget

export type CanvasInput = CoreDotMatrix | DotMatrixData | CanvasCodeEncodeRequest

export type CanvasRenderOptions = Omit<CoreCanvasRenderOptions, 'target'> & {
  target: CanvasTarget
}

export type CanvasCodeRenderOptions<TType extends EncodableCodeType = EncodableCodeType> = CanvasRenderOptions & {
  type: TType
  encode?: CodeEncodeOptionsMap[TType]
}

function isCoreDotMatrix(input: CanvasInput): input is CoreDotMatrix {
  return !Array.isArray(input) && 'data' in input && 'metadata' in input
}

function isCodeEncodeRequest(input: CanvasInput): input is CanvasCodeEncodeRequest {
  return !Array.isArray(input) && 'type' in input && 'content' in input
}

function resolveInput(input: CanvasInput): CoreDotMatrix | DotMatrixData {
  return isCodeEncodeRequest(input) ? encode(input) : input
}

function getMatrixData(input: CoreDotMatrix | DotMatrixData): DotMatrixData {
  return isCoreDotMatrix(input) ? input.data : input
}

function isCanvasElementTarget(target: CanvasTarget): target is CanvasElementTarget {
  return 'getContext' in target
}

function getContext(target: CanvasTarget): Canvas2DContext {
  if (isCanvasElementTarget(target)) {
    const context = target.getContext('2d')
    if (context === null)
      throw new Error('Canvas 2D context is not available')
    return context
  }

  return target
}

function resizeTarget(target: CanvasTarget, context: Canvas2DContext, width: number, height: number): void {
  if (isCanvasElementTarget(target)) {
    target.width = width
    target.height = height
    return
  }

  if (context.canvas !== undefined) {
    context.canvas.width = width
    context.canvas.height = height
  }
}

function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be a positive number`)
}

function renderData(matrix: DotMatrixData, options: CanvasRenderOptions): Canvas2DContext {
  const moduleSize = options.moduleSize ?? 4
  assertFinitePositive(moduleSize, 'moduleSize')

  const context = getContext(options.target)
  const width = matrix.length > 0 ? matrix[0].length : 0
  const height = matrix.length
  const pixelWidth = width * moduleSize
  const pixelHeight = height * moduleSize
  const foreground = options.foreground ?? '#000000'
  const background = options.background ?? '#FFFFFF'

  resizeTarget(options.target, context, pixelWidth, pixelHeight)

  context.clearRect?.(0, 0, pixelWidth, pixelHeight)
  context.fillStyle = background
  context.fillRect(0, 0, pixelWidth, pixelHeight)
  context.fillStyle = foreground

  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
    const row = matrix[rowIndex]
    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      if (row[columnIndex] === 1) {
        context.fillRect(
          columnIndex * moduleSize,
          rowIndex * moduleSize,
          moduleSize,
          moduleSize,
        )
      }
    }
  }

  return context
}

export function renderCanvas<TType extends EncodableCodeType>(content: string, options: CanvasCodeRenderOptions<TType>): Canvas2DContext
export function renderCanvas(input: CanvasInput, options: CanvasRenderOptions): Canvas2DContext
export function renderCanvas<TType extends EncodableCodeType>(
  input: CanvasInput | string,
  options: CanvasRenderOptions | CanvasCodeRenderOptions<TType>,
): Canvas2DContext {
  if (typeof input === 'string' && !('type' in options))
    throw new Error('Canvas code rendering requires a code type')

  const resolved = typeof input === 'string'
    ? encode({
        type: (options as CanvasCodeRenderOptions<TType>).type,
        content: input,
        options: (options as CanvasCodeRenderOptions<TType>).encode,
      } as CodeEncodeRequest)
    : resolveInput(input)

  return renderData(getMatrixData(resolved), options)
}
