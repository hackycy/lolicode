/**
 * 单个点的值：0 = 空白, 1 = 填充
 */
export type DotValue = 0 | 1

/**
 * 点阵数据矩阵
 */
export interface DotMatrix {
  /** 二维数组，每个元素为 0 或 1 */
  data: DotValue[][]
  /** 矩阵宽度（列数） */
  width: number
  /** 矩阵高度（行数） */
  height: number
  /** 元数据信息 */
  metadata: DotMatrixMetadata
}

/**
 * 点阵元数据
 */
export interface DotMatrixMetadata {
  /** 码制类型 */
  type: CodeType
  /** QR Code 专用：版本号 (1-40) */
  version?: number
  /** QR Code 专用：纠错等级 */
  errorLevel?: ErrorCorrectionLevel
  /** 条形码专用：编码内容长度 */
  contentLength?: number
  /** 编码时间戳 */
  generatedAt: number
}

/**
 * 支持的码制类型
 */
export type CodeType
  = | 'qrcode'
    | 'qrcode-micro'
    | 'datamatrix'
    | 'pdf417'
    | 'aztec'
    | 'code128'
    | 'code39'
    | 'code93'
    | 'codabar'
    | 'gs1_128'
    | 'msi'
    | 'ean13'
    | 'ean8'
    | 'upca'
    | 'upce'
    | 'itf'

/**
 * QR Code 纠错等级
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
