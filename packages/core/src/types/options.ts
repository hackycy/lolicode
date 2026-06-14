import type { CodeType, ErrorCorrectionLevel } from './matrix'

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
  mode?: 'numeric' | 'alphanumeric' | 'byte'
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
export interface BarcodeOptions {
  /** 窄模块横向列数，默认 2 */
  moduleWidth?: number
  /** 条码主体高度（行数），默认 24 */
  height?: number
  /** 左右静区宽度（窄模块数），默认 10 */
  quietZone?: number
  /** 上下留白高度（行数），默认 1 */
  verticalMargin?: number
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

/**
 * 可直接编码的码制类型
 */
export type EncodableCodeType = Exclude<CodeType, 'qrcode-micro'>

/**
 * 各码制对应的编码选项
 */
export interface CodeEncodeOptionsMap {
  qrcode: QRCodeOptions
  datamatrix: DataMatrixOptions
  pdf417: PDF417Options
  aztec: BaseEncodeOptions
  code128: Code128Options
  code39: BarcodeOptions
  code93: BarcodeOptions
  codabar: BarcodeOptions
  gs1_128: BarcodeOptions
  msi: BarcodeOptions
  ean13: EANOptions
  ean8: EANOptions
  upca: EANOptions
  upce: EANOptions
  itf: ITFOptions
}

/**
 * 声明式编码请求
 */
export type CodeEncodeRequest<TType extends EncodableCodeType = EncodableCodeType> = {
  [Type in TType]: {
    type: Type
    content: string
    options?: CodeEncodeOptionsMap[Type]
  }
}[TType]
