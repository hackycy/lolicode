import type { DotMatrix, Renderer } from '../types'

/**
 * 渲染器基类，提供通用逻辑
 */
export abstract class BaseRenderer<TOutput, TOptions = object> implements Renderer<TOutput, TOptions> {
  abstract readonly name: string

  abstract render(matrix: DotMatrix, options?: TOptions): TOutput
}
