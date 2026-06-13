import type { Renderer } from '@lolicode/core'

import type { SVGInput, SVGRenderOptions } from './svg-renderer'
import { renderSVG } from './svg-renderer'

export { renderSVG }
export type { SVGCodeRenderOptions, SVGInput, SVGRenderOptions } from './svg-renderer'

export class SVGRenderer implements Renderer<string, SVGRenderOptions> {
  readonly name = 'svg'
  render(input: SVGInput, options?: SVGRenderOptions): string {
    return renderSVG(input, options)
  }
}
