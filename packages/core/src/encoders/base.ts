import type { BaseEncodeOptions, CodeType, DotMatrix } from '../types'

/**
 * 编码器抽象基类
 */
export abstract class Encoder<TOptions extends BaseEncodeOptions> {
  /**
   * 编码内容为点阵数据
   */
  abstract encode(content: string, options?: TOptions): DotMatrix

  /**
   * 验证输入内容是否有效
   */
  abstract validate(content: string): boolean

  /**
   * 获取该码制支持的内容最大长度
   */
  abstract getMaxLength(): number

  /**
   * 获取码制类型标识
   */
  abstract getType(): CodeType
}
