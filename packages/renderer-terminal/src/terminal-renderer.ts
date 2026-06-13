import type {
  CodeEncodeOptionsMap,
  CodeEncodeRequest,
  DotMatrix as CoreDotMatrix,
  EncodableCodeType,
  TerminalRenderOptions,
} from '@lolicode/core'
import { encode } from '@lolicode/core'

export type { TerminalRenderOptions } from '@lolicode/core'

type DotValue = 0 | 1
type DotMatrixData = DotValue[][]
type TerminalCodeType = Extract<EncodableCodeType, 'qrcode' | 'datamatrix' | 'pdf417' | 'aztec'>
type TerminalCodeEncodeRequest = CodeEncodeRequest<TerminalCodeType>
export type TerminalInput = CoreDotMatrix | DotMatrixData | TerminalCodeEncodeRequest

export type TerminalCodeRenderOptions<TType extends TerminalCodeType = TerminalCodeType> = TerminalRenderOptions & {
  type: TType
  encode?: CodeEncodeOptionsMap[TType]
}

function isCoreDotMatrix(input: TerminalInput): input is CoreDotMatrix {
  return !Array.isArray(input) && 'data' in input && 'metadata' in input
}

function isCodeEncodeRequest(input: TerminalInput): input is TerminalCodeEncodeRequest {
  return !Array.isArray(input) && 'type' in input && 'content' in input
}

function resolveInput(input: TerminalInput): CoreDotMatrix | DotMatrixData {
  rejectLinearRequest(input)
  return isCodeEncodeRequest(input) ? encode(input) : input
}

function getMatrixData(input: CoreDotMatrix | DotMatrixData): DotMatrixData {
  return isCoreDotMatrix(input) ? input.data : input
}

function assertTerminalSupported(input: CoreDotMatrix | DotMatrixData): void {
  if (isCoreDotMatrix(input) && input.metadata.family === 'linear') {
    throw new Error('Terminal renderer does not support linear barcodes. Use a pixel renderer such as SVG, Canvas, or PNG.')
  }
}

function rejectLinearRequest(input: unknown): void {
  if (typeof input !== 'object' || input === null || Array.isArray(input) || !('type' in input))
    return

  const type = (input as { type: string }).type
  if (
    type === 'code128'
    || type === 'code39'
    || type === 'code93'
    || type === 'codabar'
    || type === 'gs1_128'
    || type === 'msi'
    || type === 'ean13'
    || type === 'ean8'
    || type === 'upca'
    || type === 'upce'
    || type === 'itf'
  ) {
    throw new Error('Terminal renderer does not support linear barcodes. Use a pixel renderer such as SVG, Canvas, or PNG.')
  }
}

function addMargin(matrix: DotMatrixData, margin: number): DotMatrixData {
  if (margin === 0)
    return matrix

  const srcHeight = matrix.length
  const srcWidth = srcHeight > 0 ? matrix[0].length : 0
  const newWidth = srcWidth + margin * 2
  const newHeight = srcHeight + margin * 2
  const padded: DotMatrixData = Array.from({ length: newHeight }, () => Array.from({ length: newWidth }, () => 0 as DotValue))

  for (let r = 0; r < srcHeight; r++) {
    const srcRow = matrix[r]
    const dstRow = padded[margin + r]
    for (let c = 0; c < srcWidth; c++)
      dstRow[margin + c] = srcRow[c]
  }

  return padded
}

function renderUtf8(matrix: DotMatrixData, invert: boolean): string {
  if (matrix.length === 0)
    return ''

  const rows: string[] = []
  const len = matrix.length % 2 === 0 ? matrix.length : matrix.length + 1

  for (let r = 0; r < len; r += 2) {
    const top = matrix[r]
    const bottom = r + 1 < matrix.length ? matrix[r + 1] : undefined
    const width = top.length
    let line = ''

    for (let c = 0; c < width; c++) {
      let t = top[c]
      let b = bottom !== undefined ? bottom[c] : 0
      if (invert) {
        t = t === 1 ? 0 : 1
        if (bottom !== undefined)
          b = b === 1 ? 0 : 1
      }
      if (t === 0 && b === 0)
        line += ' '
      else if (t === 0 && b === 1)
        line += '▄'
      else if (t === 1 && b === 0)
        line += '▀'
      else
        line += '█'
    }

    rows.push(line)
  }

  return rows.join('\n')
}

function renderAnsi(matrix: DotMatrixData, invert: boolean): string {
  if (matrix.length === 0)
    return ''

  return matrix
    .map(row =>
      row
        .map((cell) => {
          const filled = invert ? cell === 0 : cell === 1
          const bg = filled ? '\x1B[40m' : '\x1B[47m'
          return `${bg}  \x1B[0m`
        })
        .join(''),
    )
    .join('\n')
}

function renderSmall(matrix: DotMatrixData, invert: boolean): string {
  if (matrix.length === 0)
    return ''

  const rows: string[] = []
  const len = matrix.length % 2 === 0 ? matrix.length : matrix.length + 1

  for (let r = 0; r < len; r += 2) {
    const top = matrix[r]
    const bottom = r + 1 < matrix.length ? matrix[r + 1] : undefined
    const width = top.length
    let line = ''

    for (let c = 0; c < width; c++) {
      let t = top[c]
      let b = bottom !== undefined ? bottom[c] : 0
      if (invert) {
        t = t === 1 ? 0 : 1
        if (bottom !== undefined)
          b = b === 1 ? 0 : 1
      }
      if (t === 1 && b === 1)
        line += '\x1B[40m\x1B[30m█\x1B[0m'
      else if (t === 1 && b === 0)
        line += '\x1B[47m\x1B[30m▀\x1B[0m'
      else if (t === 0 && b === 1)
        line += '\x1B[47m\x1B[30m▄\x1B[0m'
      else
        line += '\x1B[47m\x1B[37m \x1B[0m'
    }

    rows.push(line)
  }

  return rows.join('\n')
}

export function renderTerminal<TType extends TerminalCodeType>(content: string, options: TerminalCodeRenderOptions<TType>): string
export function renderTerminal(input: TerminalInput, options?: TerminalRenderOptions): string
export function renderTerminal<TType extends TerminalCodeType>(
  input: TerminalInput | string,
  options?: TerminalRenderOptions | TerminalCodeRenderOptions<TType>,
): string {
  if (typeof input === 'string' && (options === undefined || !('type' in options))) {
    throw new Error('Terminal code rendering requires a code type')
  }

  if (typeof input === 'string')
    rejectLinearRequest(options)

  const resolved = typeof input === 'string'
    ? encode({
        type: (options as TerminalCodeRenderOptions<TType>).type,
        content: input,
        options: (options as TerminalCodeRenderOptions<TType>).encode,
      } as TerminalCodeEncodeRequest)
    : resolveInput(input)

  assertTerminalSupported(resolved)

  const renderOptions = options as TerminalRenderOptions | undefined
  const mode = renderOptions?.mode ?? 'utf8'
  const margin = renderOptions?.margin ?? 0
  const invert = renderOptions?.invert ?? false

  const padded = addMargin(getMatrixData(resolved), margin)

  switch (mode) {
    case 'utf8':
      return renderUtf8(padded, invert)
    case 'ansi':
      return renderAnsi(padded, invert)
    case 'small':
      return renderSmall(padded, invert)
  }

  throw new Error(`Unsupported terminal render mode: ${mode}`)
}
