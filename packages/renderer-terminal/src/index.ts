import type { DotMatrix, Renderer } from '@lolicode/core'

import type { TerminalRenderOptions } from './terminal-renderer'
import { renderTerminal } from './terminal-renderer'

export { renderTerminal }
export type { TerminalRenderOptions }

export class TerminalRenderer implements Renderer<string, TerminalRenderOptions> {
  readonly name = 'terminal'
  render(matrix: DotMatrix, options?: TerminalRenderOptions): string {
    return renderTerminal(matrix, options)
  }
}
