import type { Renderer } from '@lolicode/core'

import type { TerminalInput, TerminalRenderOptions } from './terminal-renderer'
import { renderTerminal } from './terminal-renderer'

export { renderTerminal }
export type { TerminalCodeRenderOptions, TerminalInput, TerminalRenderOptions } from './terminal-renderer'

export class TerminalRenderer implements Renderer<string, TerminalRenderOptions> {
  readonly name = 'terminal'
  render(input: TerminalInput, options?: TerminalRenderOptions): string {
    return renderTerminal(input, options)
  }
}
