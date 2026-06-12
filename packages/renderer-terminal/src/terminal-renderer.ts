import type { DotMatrix, TerminalRenderOptions } from '@lolicode/core'
import { BaseRenderer } from '@lolicode/core'

export class TerminalRenderer extends BaseRenderer<string, TerminalRenderOptions> {
  readonly name = 'terminal'

  render(matrix: DotMatrix, options?: TerminalRenderOptions): string {
    if (matrix.height === 0)
      return ''

    const filledChar = options?.filledChar ?? '██'
    const emptyChar = options?.emptyChar ?? '  '
    const useColor = options?.useColor ?? false

    return matrix.data
      .map(row =>
        row
          .map((cell) => {
            const char = cell === 1 ? filledChar : emptyChar
            if (useColor) {
              const bg = cell === 1 ? '\x1B[40m' : '\x1B[47m'
              return `${bg}${char}\x1B[0m`
            }
            return char
          })
          .join(''),
      )
      .join('\n')
  }
}
