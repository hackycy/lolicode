import type { ErrorCorrectionLevel } from './matrix'

/**
 * 基础编码选项
 */
export interface BaseEncodeOptions {
  /** 边距（模块数），默认 4 */
  margin?: number
  /** 是否反转颜色（白底黑点 → 黑底白点） */
  inverted?: boolean
}

/**
 * QR Code 编码选项
 */
export interface QRCodeOptions extends BaseEncodeOptions {
  /** 版本号 (1-40)，不指定则自动选择 */
  version?: number
  /** 纠错等级，默认 'M' */
  errorLevel?: ErrorCorrectionLevel
  /** 掩码模式 (0-7)，不指定则自动选择最优 */
  maskPattern?: number
  /** 编码模式，不指定则自动选择 */
  mode?: 'numeric' | 'alphanumeric' | 'byte' | 'kanji'
}

/**
 * Data Matrix 编码选项
 */
export interface DataMatrixOptions extends BaseEncodeOptions {
  /** 形状：方形或矩形 */
  shape?: 'square' | 'rectangle'
  /** 编码模式 */
  mode?: 'ascii' | 'c40' | 'text' | 'x12' | 'edifact' | 'base256'
}

/**
 * PDF417 编码选项
 */
export interface PDF417Options extends BaseEncodeOptions {
  /** 安全等级 (0-8) */
  securityLevel?: number
  /** 列数 (1-30) */
  columns?: number
  /** 行高 (1-90) */
  rows?: number
  /** 宽高比 */
  aspectRatio?: number
}

/**
 * 一维码编码选项
 */
export interface BarcodeOptions extends BaseEncodeOptions {
  /** 条宽（窄条的单位宽度），默认 2 */
  moduleWidth?: number
  /** 条高，默认 100 */
  height?: number
  /** 是否显示文字 */
  showText?: boolean
}

/**
 * EAN/UPC 编码选项
 */
export interface EANOptions extends BarcodeOptions {
  /** 是否包含校验位，默认 true（自动计算） */
  includeChecksum?: boolean
}

/**
 * Code 128 编码选项
 */
export interface Code128Options extends BarcodeOptions {
  /** 编码子集：A/B/C 或自动 */
  subset?: 'A' | 'B' | 'C' | 'auto'
}

/**
 * ITF 编码选项
 */
export interface ITFOptions extends BarcodeOptions {
  /** 宽窄比，默认 2.5 */
  wideToNarrowRatio?: number
}
