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
 * Canvas 渲染选项
 */
export interface CanvasRenderOptions {
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
export interface SVGRenderOptions {
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
export interface TerminalRenderOptions {
  /** 空白字符，默认 '  '（两个空格） */
  emptyChar?: string
  /** 填充字符，默认 '██' */
  filledChar?: string
  /** 是否使用颜色 */
  useColor?: boolean
}
