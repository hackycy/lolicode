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
export type TerminalInput = CoreDotMatrix | DotMatrixData | CodeEncodeRequest

export type TerminalCodeRenderOptions<TType extends EncodableCodeType = EncodableCodeType> = TerminalRenderOptions & {
  type: TType
  encode?: CodeEncodeOptionsMap[TType]
}

function isCoreDotMatrix(input: TerminalInput): input is CoreDotMatrix {
  return !Array.isArray(input) && 'data' in input && 'metadata' in input
}

function isCodeEncodeRequest(input: TerminalInput): input is CodeEncodeRequest {
  return !Array.isArray(input) && 'type' in input && 'content' in input
}

function resolveInput(input: TerminalInput): CoreDotMatrix | DotMatrixData {
  return isCodeEncodeRequest(input) ? encode(input) : input
}

function getMatrixData(input: CoreDotMatrix | DotMatrixData): DotMatrixData {
  return isCoreDotMatrix(input) ? input.data : input
}

function isBarcodeMatrix(input: CoreDotMatrix | DotMatrixData): boolean {
  return isCoreDotMatrix(input) && input.metadata.family === 'linear'
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

function fitColumns(row: DotValue[], maxWidth?: number): DotValue[] {
  if (maxWidth === undefined || maxWidth <= 0 || row.length <= maxWidth)
    return row

  return Array.from({ length: maxWidth }, (_unused, index) => {
    const start = Math.floor(index * row.length / maxWidth)
    const end = Math.max(start + 1, Math.floor((index + 1) * row.length / maxWidth))
    let filled = 0
    for (let i = start; i < end; i++) {
      if (row[i] === 1)
        filled++
    }
    return filled * 2 >= end - start ? 1 : 0
  })
}

function renderBars(matrix: DotMatrixData, invert: boolean, height: number, maxWidth?: number): string {
  if (matrix.length === 0 || height <= 0)
    return ''

  const width = matrix[0].length
  const projected: DotValue[] = []
  for (let col = 0; col < width; col++) {
    let filled = false
    for (const row of matrix) {
      if (row[col] === 1) {
        filled = true
        break
      }
    }
    projected.push((invert ? !filled : filled) ? 1 : 0)
  }

  const fitted = fitColumns(projected, maxWidth)
  const line = fitted.map(cell => cell === 1 ? '█' : ' ').join('')
  return Array.from({ length: height }, () => line).join('\n')
}

export function renderTerminal<TType extends EncodableCodeType>(content: string, options: TerminalCodeRenderOptions<TType>): string
export function renderTerminal(input: TerminalInput, options?: TerminalRenderOptions): string
export function renderTerminal<TType extends EncodableCodeType>(
  input: TerminalInput | string,
  options?: TerminalRenderOptions | TerminalCodeRenderOptions<TType>,
): string {
  if (typeof input === 'string' && (options === undefined || !('type' in options))) {
    throw new Error('Terminal code rendering requires a code type')
  }

  const resolved = typeof input === 'string'
    ? encode({
        type: (options as TerminalCodeRenderOptions<TType>).type,
        content: input,
        options: (options as TerminalCodeRenderOptions<TType>).encode,
      } as CodeEncodeRequest)
    : resolveInput(input)
  const renderOptions = options as TerminalRenderOptions | undefined
  const isBarcode = isBarcodeMatrix(resolved)
  const intent = renderOptions?.intent ?? 'preview'
  const mode = renderOptions?.mode ?? (isBarcode ? 'bars' : 'utf8')
  const margin = renderOptions?.margin ?? 0
  const invert = renderOptions?.invert ?? false
  const barHeight = renderOptions?.barHeight ?? (isBarcode && intent === 'preview' ? 4 : 6)
  const maxWidth = renderOptions?.viewport?.maxWidth ?? renderOptions?.maxWidth ?? (isBarcode && intent === 'preview' ? 60 : undefined)

  const padded = addMargin(getMatrixData(resolved), margin)

  switch (mode) {
    case 'utf8':
      return renderUtf8(padded, invert)
    case 'ansi':
      return renderAnsi(padded, invert)
    case 'small':
      return renderSmall(padded, invert)
    case 'bars':
      return renderBars(padded, invert, barHeight, maxWidth)
  }
}
