type DotValue = 0 | 1
type DotMatrix = DotValue[][]

export interface TerminalRenderOptions {
  mode?: 'utf8' | 'ansi' | 'small'
  margin?: number
  invert?: boolean
}

function addMargin(matrix: DotMatrix, margin: number): DotMatrix {
  if (margin === 0)
    return matrix

  const srcHeight = matrix.length
  const srcWidth = srcHeight > 0 ? matrix[0].length : 0
  const newWidth = srcWidth + margin * 2
  const newHeight = srcHeight + margin * 2
  const padded: DotMatrix = Array.from({ length: newHeight }, () => Array.from({ length: newWidth }, () => 0 as DotValue))

  for (let r = 0; r < srcHeight; r++) {
    const srcRow = matrix[r]
    const dstRow = padded[margin + r]
    for (let c = 0; c < srcWidth; c++)
      dstRow[margin + c] = srcRow[c]
  }

  return padded
}

function renderUtf8(matrix: DotMatrix, invert: boolean): string {
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

function renderAnsi(matrix: DotMatrix, invert: boolean): string {
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

function renderSmall(matrix: DotMatrix, invert: boolean): string {
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
        line += '\x1B[40m\x1B[37m▀\x1B[0m'
      else if (t === 0 && b === 1)
        line += '\x1B[47m\x1B[30m▄\x1B[0m'
      else
        line += '\x1B[47m\x1B[37m \x1B[0m'
    }

    rows.push(line)
  }

  return rows.join('\n')
}

export function renderTerminal(matrix: DotMatrix, options?: TerminalRenderOptions): string {
  const mode = options?.mode ?? 'utf8'
  const margin = options?.margin ?? 0
  const invert = options?.invert ?? false

  const padded = addMargin(matrix, margin)

  switch (mode) {
    case 'utf8':
      return renderUtf8(padded, invert)
    case 'ansi':
      return renderAnsi(padded, invert)
    case 'small':
      return renderSmall(padded, invert)
  }
}
