import type { DotMatrix } from './matrix'

/**
 * 渲染器抽象接口
 */
export interface Renderer<TOutput, TOptions = object> {
  /**
   * 将点阵数据渲染为目标格式
   * @param matrix 点阵数据
   * @param options 渲染选项
   */
  render: (matrix: DotMatrix, options?: TOptions) => TOutput

  /**
   * 渲染器名称
   */
  readonly name: string
}

/**
 * 所有渲染器共享的基础选项
 */
export interface BaseRenderOptions {}

/**
 * Canvas 渲染选项
 */
export interface CanvasRenderOptions extends BaseRenderOptions {
  /** Canvas 元素或 2D Context（浏览器环境） */
  target: unknown
  /** 模块大小（像素），默认 4 */
  moduleSize?: number
  /** 前景色（黑点），默认 '#000000' */
  foreground?: string
  /** 背景色，默认 '#FFFFFF' */
  background?: string
}

/**
 * SVG 渲染选项
 */
export interface SVGRenderOptions extends BaseRenderOptions {
  /** 模块大小（像素），默认 4 */
  moduleSize?: number
  /** 前景色，默认 '#000000' */
  foreground?: string
  /** 背景色，默认 '#FFFFFF' */
  background?: string
  /** 是否添加 XML 声明 */
  includeDeclaration?: boolean
}

/**
 * 终端渲染选项
 */
export interface TerminalRenderOptions extends BaseRenderOptions {
  /** 渲染模式，默认 utf8 */
  mode?: 'utf8' | 'ansi' | 'small'
  /** 终端层附加空白边距 */
  margin?: number
  /** 是否反转填充和空白 */
  invert?: boolean
}
