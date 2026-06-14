import type { DataMatrixOptions, DotMatrix, DotValue } from '../../types'
import { finalizeMatrix } from '../../utils/bit-matrix'
import { getBytes } from '../../utils/encoding'
import { Encoder } from '../base'
import { calculateECC200 } from './reed-solomon'

// Data Matrix ECC200 符号信息
// matrixWidth/matrixHeight: 单个数据区（不含寻像边框）的尺寸
// dataRegions: 数据区个数（决定边框平铺）
interface SizeInfo {
  rows: number
  cols: number
  dataCapacity: number
  ecCapacity: number
  matrixWidth: number
  matrixHeight: number
  dataRegions: number
}

// 仅包含单 RS 块（无交错）尺寸：方形 10x10..48x48 + 全部矩形。
// 交错块尺寸（52x52 及以上）暂不支持，因其交错布局无法在本环境验证。
function makeSquare(
  size: number,
  dataCapacity: number,
  ecCapacity: number,
  matrixSize: number,
  dataRegions: number,
): SizeInfo {
  return {
    rows: size,
    cols: size,
    dataCapacity,
    ecCapacity,
    matrixWidth: matrixSize,
    matrixHeight: matrixSize,
    dataRegions,
  }
}

const SIZES: SizeInfo[] = [
  makeSquare(10, 3, 5, 8, 1),
  makeSquare(12, 5, 7, 10, 1),
  makeSquare(14, 8, 10, 12, 1),
  makeSquare(16, 12, 12, 14, 1),
  makeSquare(18, 18, 14, 16, 1),
  makeSquare(20, 22, 18, 18, 1),
  makeSquare(22, 30, 20, 20, 1),
  makeSquare(24, 36, 24, 22, 1),
  makeSquare(26, 44, 28, 24, 1),
  makeSquare(32, 62, 36, 14, 4),
  makeSquare(36, 86, 42, 16, 4),
  makeSquare(40, 114, 48, 18, 4),
  makeSquare(44, 144, 56, 20, 4),
  makeSquare(48, 174, 68, 22, 4),
]

// 矩形 Data Matrix 尺寸（全部为单 RS 块）
const RECT_SIZES: SizeInfo[] = [
  { rows: 8, cols: 18, dataCapacity: 5, ecCapacity: 7, matrixWidth: 16, matrixHeight: 6, dataRegions: 1 },
  { rows: 8, cols: 32, dataCapacity: 10, ecCapacity: 11, matrixWidth: 14, matrixHeight: 6, dataRegions: 2 },
  { rows: 12, cols: 26, dataCapacity: 16, ecCapacity: 14, matrixWidth: 24, matrixHeight: 10, dataRegions: 1 },
  { rows: 12, cols: 36, dataCapacity: 22, ecCapacity: 18, matrixWidth: 16, matrixHeight: 10, dataRegions: 2 },
  { rows: 16, cols: 36, dataCapacity: 32, ecCapacity: 24, matrixWidth: 16, matrixHeight: 14, dataRegions: 2 },
  { rows: 16, cols: 48, dataCapacity: 49, ecCapacity: 28, matrixWidth: 22, matrixHeight: 14, dataRegions: 2 },
]

const PAD = 129

/**
 * Data Matrix 编码器（ECC200）
 *
 * 实现 ASCII 模式高层编码、ISO/IEC 16022 附录 E 的 Reed-Solomon 纠错，
 * 以及附录 M.1 的符号字符布局，可被标准扫描器识别。
 * 支持单 RS 块的方形（10x10..48x48）与矩形符号。
 */
export class DataMatrixEncoder extends Encoder<DataMatrixOptions> {
  getType(): 'datamatrix' {
    return 'datamatrix' as const
  }

  getMaxLength(): number {
    return 174
  }

  validate(content: string): boolean {
    return content.length > 0 && content.length <= this.getMaxLength()
  }

  encode(content: string, options?: DataMatrixOptions): DotMatrix {
    if (!this.validate(content)) {
      throw new Error(`Invalid Data Matrix content: "${content}"`)
    }

    const shape = options?.shape ?? 'square'

    const dataCodewords = this.encodeASCII(content)
    const sizeInfo = this.selectSize(dataCodewords.length, shape)
    const paddedData = this.padData(dataCodewords, sizeInfo.dataCapacity)
    const ecCodewords = calculateECC200(paddedData, sizeInfo.ecCapacity)
    const allCodewords = [...paddedData, ...ecCodewords]

    const matrix = this.buildMatrix(allCodewords, sizeInfo)

    const dotMatrix: DotMatrix = {
      data: matrix,
      width: sizeInfo.cols,
      height: sizeInfo.rows,
      metadata: {
        type: 'datamatrix',
        family: 'matrix',
        generatedAt: Date.now(),
      },
    }

    return finalizeMatrix(dotMatrix, options, 1)
  }

  private encodeASCII(content: string): number[] {
    const bytes = getBytes(content)
    const result: number[] = []

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]
      if (byte >= 48 && byte <= 57 && i + 1 < bytes.length) {
        const next = bytes[i + 1]
        if (next >= 48 && next <= 57) {
          // 数字对编码
          result.push((byte - 48) * 10 + (next - 48) + 130)
          i++
          continue
        }
      }
      if (byte <= 127) {
        result.push(byte + 1)
      }
      else {
        // 扩展 ASCII
        result.push(235)
        result.push(byte - 127)
      }
    }

    return result
  }

  private selectSize(dataLength: number, shape: string): SizeInfo {
    const sizes = shape === 'rectangle' ? RECT_SIZES : SIZES
    for (const size of sizes) {
      if (dataLength <= size.dataCapacity) {
        return size
      }
    }
    throw new Error('Data too long for Data Matrix')
  }

  /**
   * ISO/IEC 16022 附录 E：首位填充用 PAD(129)，其余用 253-state 伪随机算法。
   */
  private padData(data: number[], capacity: number): number[] {
    const result = [...data]
    if (result.length < capacity) {
      result.push(PAD)
    }
    while (result.length < capacity) {
      const position = result.length + 1
      const pseudoRandom = ((149 * position) % 253) + 1
      const value = PAD + pseudoRandom
      result.push(value <= 254 ? value : value - 254)
    }
    return result.slice(0, capacity)
  }

  /**
   * 附录 M.1：将码字按 ECC200 utah 形布局到数据区，再平铺寻像边框。
   */
  private buildMatrix(codewords: number[], sizeInfo: SizeInfo): DotValue[][] {
    const placement = this.placeCodewords(codewords, sizeInfo)
    return this.addFinderPattern(placement, sizeInfo)
  }

  /**
   * 附录 M.1 符号字符布局，返回 symbolDataHeight x symbolDataWidth 的位矩阵。
   */
  private placeCodewords(codewords: number[], sizeInfo: SizeInfo): number[][] {
    const numcols = this.symbolDataWidth(sizeInfo)
    const numrows = this.symbolDataHeight(sizeInfo)
    // -1 表示未填充
    const bits: number[] = Array.from({ length: numrows * numcols }, () => -1)

    const setBit = (col: number, row: number, value: number): void => {
      bits[row * numcols + col] = value
    }
    const noBit = (col: number, row: number): boolean => bits[row * numcols + col] < 0

    const module = (row: number, col: number, pos: number, bit: number): void => {
      let r = row
      let c = col
      if (r < 0) {
        r += numrows
        c += 4 - ((numrows + 4) % 8)
      }
      if (c < 0) {
        c += numcols
        r += 4 - ((numcols + 4) % 8)
      }
      const codeword = codewords[pos]
      const value = codeword & (1 << (8 - bit))
      setBit(c, r, value !== 0 ? 1 : 0)
    }

    const utah = (row: number, col: number, pos: number): void => {
      module(row - 2, col - 2, pos, 1)
      module(row - 2, col - 1, pos, 2)
      module(row - 1, col - 2, pos, 3)
      module(row - 1, col - 1, pos, 4)
      module(row - 1, col, pos, 5)
      module(row, col - 2, pos, 6)
      module(row, col - 1, pos, 7)
      module(row, col, pos, 8)
    }

    const corner1 = (pos: number): void => {
      module(numrows - 1, 0, pos, 1)
      module(numrows - 1, 1, pos, 2)
      module(numrows - 1, 2, pos, 3)
      module(0, numcols - 2, pos, 4)
      module(0, numcols - 1, pos, 5)
      module(1, numcols - 1, pos, 6)
      module(2, numcols - 1, pos, 7)
      module(3, numcols - 1, pos, 8)
    }
    const corner2 = (pos: number): void => {
      module(numrows - 3, 0, pos, 1)
      module(numrows - 2, 0, pos, 2)
      module(numrows - 1, 0, pos, 3)
      module(0, numcols - 4, pos, 4)
      module(0, numcols - 3, pos, 5)
      module(0, numcols - 2, pos, 6)
      module(0, numcols - 1, pos, 7)
      module(1, numcols - 1, pos, 8)
    }
    const corner3 = (pos: number): void => {
      module(numrows - 3, 0, pos, 1)
      module(numrows - 2, 0, pos, 2)
      module(numrows - 1, 0, pos, 3)
      module(0, numcols - 2, pos, 4)
      module(0, numcols - 1, pos, 5)
      module(1, numcols - 1, pos, 6)
      module(2, numcols - 1, pos, 7)
      module(3, numcols - 1, pos, 8)
    }
    const corner4 = (pos: number): void => {
      module(numrows - 1, 0, pos, 1)
      module(numrows - 1, numcols - 1, pos, 2)
      module(0, numcols - 3, pos, 3)
      module(0, numcols - 2, pos, 4)
      module(0, numcols - 1, pos, 5)
      module(1, numcols - 3, pos, 6)
      module(1, numcols - 2, pos, 7)
      module(1, numcols - 1, pos, 8)
    }

    let pos = 0
    let row = 4
    let col = 0

    do {
      if (row === numrows && col === 0)
        corner1(pos++)
      if (row === numrows - 2 && col === 0 && numcols % 4 !== 0)
        corner2(pos++)
      if (row === numrows - 2 && col === 0 && numcols % 8 === 4)
        corner3(pos++)
      if (row === numrows + 4 && col === 2 && numcols % 8 === 0)
        corner4(pos++)

      do {
        if (row < numrows && col >= 0 && noBit(col, row))
          utah(row, col, pos++)
        row -= 2
        col += 2
      } while (row >= 0 && col < numcols)
      row += 1
      col += 3

      do {
        if (row >= 0 && col < numcols && noBit(col, row))
          utah(row, col, pos++)
        row += 2
        col -= 2
      } while (row < numrows && col >= 0)
      row += 3
      col += 1
    } while (row < numrows || col < numcols)

    // 右下角固定图案
    if (noBit(numcols - 1, numrows - 1)) {
      setBit(numcols - 1, numrows - 1, 1)
      setBit(numcols - 2, numrows - 2, 1)
    }

    const grid: number[][] = []
    for (let r = 0; r < numrows; r++) {
      const gridRow: number[] = []
      for (let c = 0; c < numcols; c++) {
        gridRow.push(Math.max(0, bits[r * numcols + c]))
      }
      grid.push(gridRow)
    }
    return grid
  }

  /**
   * 平铺寻像边框：每个数据区左/下为实线，上/右为交替时序线。
   */
  private addFinderPattern(placement: number[][], sizeInfo: SizeInfo): DotValue[][] {
    const { matrixWidth, matrixHeight } = sizeInfo
    const symbolWidth = sizeInfo.cols
    const symbolHeight = sizeInfo.rows
    const dataWidth = this.symbolDataWidth(sizeInfo)
    const dataHeight = this.symbolDataHeight(sizeInfo)

    const matrix: DotValue[][] = Array.from({ length: symbolHeight }, () =>
      Array.from({ length: symbolWidth }).fill(0) as DotValue[])

    let matrixY = 0
    for (let y = 0; y < dataHeight; y++) {
      // 数据区顶部时序线
      if (y % matrixHeight === 0) {
        let matrixX = 0
        for (let x = 0; x < symbolWidth; x++) {
          matrix[matrixY][matrixX] = (x % 2 === 0 ? 1 : 0) as DotValue
          matrixX++
        }
        matrixY++
      }

      let matrixX = 0
      for (let x = 0; x < dataWidth; x++) {
        // 数据区左侧实线
        if (x % matrixWidth === 0) {
          matrix[matrixY][matrixX] = 1
          matrixX++
        }
        matrix[matrixY][matrixX] = placement[y][x] as DotValue
        matrixX++
        // 数据区右侧时序线
        if (x % matrixWidth === matrixWidth - 1) {
          matrix[matrixY][matrixX] = (y % 2 === 0 ? 1 : 0) as DotValue
          matrixX++
        }
      }
      matrixY++

      // 数据区底部实线
      if (y % matrixHeight === matrixHeight - 1) {
        let bottomX = 0
        for (let x = 0; x < symbolWidth; x++) {
          matrix[matrixY][bottomX] = 1
          bottomX++
        }
        matrixY++
      }
    }

    return matrix
  }

  private horizontalDataRegions(dataRegions: number): number {
    switch (dataRegions) {
      case 1: return 1
      case 2: return 2
      case 4: return 2
      default: return 1
    }
  }

  private verticalDataRegions(dataRegions: number): number {
    switch (dataRegions) {
      case 1: return 1
      case 2: return 1
      case 4: return 2
      default: return 1
    }
  }

  private symbolDataWidth(sizeInfo: SizeInfo): number {
    return this.horizontalDataRegions(sizeInfo.dataRegions) * sizeInfo.matrixWidth
  }

  private symbolDataHeight(sizeInfo: SizeInfo): number {
    return this.verticalDataRegions(sizeInfo.dataRegions) * sizeInfo.matrixHeight
  }
}
