import type { Renderer } from '@lolicode/core'

import type { Canvas2DContext, CanvasInput, CanvasRenderOptions } from './canvas-renderer'
import { renderCanvas } from './canvas-renderer'

export { renderCanvas }
export type {
  Canvas2DContext,
  CanvasCodeRenderOptions,
  CanvasInput,
  CanvasRenderOptions,
  CanvasTarget,
} from './canvas-renderer'

export class CanvasRenderer implements Renderer<Canvas2DContext, CanvasRenderOptions> {
  readonly name = 'canvas'
  render(input: CanvasInput, options?: CanvasRenderOptions): Canvas2DContext {
    if (options === undefined)
      throw new Error('Canvas renderer requires a target')
    return renderCanvas(input, options)
  }
}
