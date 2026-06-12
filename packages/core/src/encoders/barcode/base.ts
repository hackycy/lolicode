import type { BarcodeOptions, BarcodeSymbol, DotMatrix, DotValue } from '../../types'
import { Encoder } from '../base'

/**
 * 一维条形码编码器基类
 *
 * 编码器先生成一维逻辑符号，再由统一布局规则映射为 DotMatrix。
 * - encodeToRuns: 条/空交替的窄模块长度序列，从条开始
 * - moduleWidth: 每个窄模块渲染成多少列
 * - height: 条码主体高度行数
 * - quietZone: 左右静区窄模块数
 * - verticalMargin: 上下留白行数
 */
export abstract class BarcodeEncoder extends Encoder<BarcodeOptions> {
  /**
   * 编码内容为条空 run-length 序列，从条开始，每个元素为窄模块数
   */
  abstract encodeToRuns(content: string): number[]

  /**
   * 获取编码后条空序列的总模块数
   */
  getModuleCount(content: string): number {
    return this.encodeToRuns(content).reduce((sum, run) => sum + run, 0)
  }

  encodeSymbol(content: string): BarcodeSymbol {
    if (!this.validate(content)) {
      throw new Error(`Invalid content for ${this.getType()}: "${content}"`)
    }

    const runs = this.encodeToRuns(content)
    const modules: DotValue[] = []
    let isBar = true

    for (const run of runs) {
      if (!Number.isInteger(run) || run <= 0) {
        throw new Error(`Invalid run length for ${this.getType()}: ${run}`)
      }
      for (let i = 0; i < run; i++) {
        modules.push(isBar ? 1 : 0)
      }
      isBar = !isBar
    }

    return {
      modules,
      width: modules.length,
      metadata: {
        type: this.getType(),
        family: 'linear',
        contentLength: content.length,
        generatedAt: Date.now(),
      },
    }
  }

  encode(content: string, options?: BarcodeOptions): DotMatrix {
    const symbol = this.encodeSymbol(content)
    const layout = this.normalizeLayout(options)
    const totalRows = layout.height + layout.verticalMargin * 2
    const totalCols = (symbol.width + layout.quietZone * 2) * layout.moduleWidth

    const data: DotValue[][] = []
    for (let r = 0; r < totalRows; r++) {
      data.push(Array.from({ length: totalCols }).fill(0) as DotValue[])
    }

    const startCol = layout.quietZone * layout.moduleWidth
    for (let index = 0; index < symbol.modules.length; index++) {
      if (symbol.modules[index] === 1) {
        const moduleStart = startCol + index * layout.moduleWidth
        for (let c = 0; c < layout.moduleWidth; c++) {
          for (let r = layout.verticalMargin; r < layout.verticalMargin + layout.height; r++) {
            data[r][moduleStart + c] = 1
          }
        }
      }
    }

    return {
      data,
      width: totalCols,
      height: totalRows,
      metadata: symbol.metadata,
    }
  }

  private normalizeLayout(options?: BarcodeOptions): Required<Pick<BarcodeOptions, 'height' | 'moduleWidth' | 'quietZone' | 'verticalMargin'>> {
    const layout = {
      moduleWidth: options?.moduleWidth ?? 2,
      height: options?.height ?? 24,
      quietZone: options?.quietZone ?? 10,
      verticalMargin: options?.verticalMargin ?? 1,
    }

    for (const [key, value] of Object.entries(layout)) {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Invalid barcode ${key}: ${value}`)
      }
    }
    if (layout.moduleWidth === 0)
      throw new Error('Invalid barcode moduleWidth: 0')
    if (layout.height === 0)
      throw new Error('Invalid barcode height: 0')

    return layout
  }
}
