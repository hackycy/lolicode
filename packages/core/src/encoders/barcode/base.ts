import type { BarcodeOptions, DotMatrix, DotValue } from '../../types'
import { Encoder } from '../base'

/**
 * 一维条形码编码器基类
 *
 * 一维码的点阵结构：
 * - 宽度 = 所有条空序列的总模块数
 * - 高度 = height（像素）映射为模块行数
 * - 每列是统一的（条或空），每一行相同
 */
export abstract class BarcodeEncoder extends Encoder<BarcodeOptions> {
  /**
   * 编码内容为条空序列（1=条, 0=空），每个元素为模块数
   */
  abstract encodeToModules(content: string): number[]

  /**
   * 获取编码后条空序列的总模块数
   */
  abstract getModuleCount(content: string): number

  encode(content: string, options?: BarcodeOptions): DotMatrix {
    if (!this.validate(content)) {
      throw new Error(`Invalid content for ${this.getType()}: "${content}"`)
    }

    const moduleWidth = options?.moduleWidth ?? 2
    const barHeight = options?.height ?? 100
    const margin = options?.margin ?? 4

    const modules = this.encodeToModules(content)
    const moduleCount = modules.reduce((sum, m) => sum + m, 0)

    // 条高映射为行数：height / moduleWidth，至少 1 行
    const rowCount = Math.max(1, Math.round(barHeight / moduleWidth))
    const totalRows = rowCount + margin * 2
    const totalCols = moduleCount + margin * 2

    // 初始化空白矩阵
    const data: DotValue[][] = []
    for (let r = 0; r < totalRows; r++) {
      data.push(Array.from({ length: totalCols }).fill(0) as DotValue[])
    }

    // 填充条形码区域
    let col = margin
    let isBar = true
    for (const mod of modules) {
      if (isBar) {
        for (let c = 0; c < mod; c++) {
          for (let r = margin; r < margin + rowCount; r++) {
            data[r][col + c] = 1
          }
        }
      }
      col += mod
      isBar = !isBar
    }

    return {
      data,
      width: totalCols,
      height: totalRows,
      metadata: {
        type: this.getType(),
        contentLength: content.length,
        generatedAt: Date.now(),
      },
    }
  }
}
