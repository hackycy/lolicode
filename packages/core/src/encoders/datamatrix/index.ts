import type { DataMatrixOptions, DotMatrix, DotValue } from '../../types'
import { getBytes } from '../../utils/encoding'
import { Encoder } from '../base'
import { calculateReedSolomon } from '../qrcode/reed-solomon'

// Data Matrix 尺寸表（行, 列, 数据容量, 纠错容量, 交错块数）
interface SizeInfo {
  rows: number
  cols: number
  dataCapacity: number
  ecCapacity: number
  interleavedBlocks: number
}

const SIZES: SizeInfo[] = [
  { rows: 10, cols: 10, dataCapacity: 3, ecCapacity: 5, interleavedBlocks: 1 },
  { rows: 12, cols: 12, dataCapacity: 5, ecCapacity: 7, interleavedBlocks: 1 },
  { rows: 14, cols: 14, dataCapacity: 8, ecCapacity: 10, interleavedBlocks: 1 },
  { rows: 16, cols: 16, dataCapacity: 12, ecCapacity: 12, interleavedBlocks: 1 },
  { rows: 18, cols: 18, dataCapacity: 18, ecCapacity: 14, interleavedBlocks: 1 },
  { rows: 20, cols: 20, dataCapacity: 22, ecCapacity: 18, interleavedBlocks: 1 },
  { rows: 22, cols: 22, dataCapacity: 30, ecCapacity: 20, interleavedBlocks: 1 },
  { rows: 24, cols: 24, dataCapacity: 36, ecCapacity: 24, interleavedBlocks: 1 },
  { rows: 26, cols: 26, dataCapacity: 44, ecCapacity: 28, interleavedBlocks: 1 },
  { rows: 32, cols: 32, dataCapacity: 62, ecCapacity: 36, interleavedBlocks: 1 },
  { rows: 36, cols: 36, dataCapacity: 86, ecCapacity: 42, interleavedBlocks: 1 },
  { rows: 40, cols: 40, dataCapacity: 114, ecCapacity: 48, interleavedBlocks: 1 },
  { rows: 44, cols: 44, dataCapacity: 144, ecCapacity: 56, interleavedBlocks: 1 },
  { rows: 48, cols: 48, dataCapacity: 174, ecCapacity: 68, interleavedBlocks: 2 },
  { rows: 52, cols: 52, dataCapacity: 204, ecCapacity: 84, interleavedBlocks: 2 },
  { rows: 64, cols: 64, dataCapacity: 280, ecCapacity: 112, interleavedBlocks: 2 },
  { rows: 72, cols: 72, dataCapacity: 368, ecCapacity: 144, interleavedBlocks: 4 },
  { rows: 80, cols: 80, dataCapacity: 456, ecCapacity: 192, interleavedBlocks: 4 },
  { rows: 88, cols: 88, dataCapacity: 576, ecCapacity: 224, interleavedBlocks: 4 },
  { rows: 96, cols: 96, dataCapacity: 696, ecCapacity: 272, interleavedBlocks: 4 },
  { rows: 104, cols: 104, dataCapacity: 816, ecCapacity: 336, interleavedBlocks: 6 },
  { rows: 120, cols: 120, dataCapacity: 1050, ecCapacity: 408, interleavedBlocks: 6 },
  { rows: 132, cols: 132, dataCapacity: 1304, ecCapacity: 496, interleavedBlocks: 8 },
  { rows: 144, cols: 144, dataCapacity: 1558, ecCapacity: 620, interleavedBlocks: 8 },
]

// 矩形 Data Matrix 尺寸
const RECT_SIZES: SizeInfo[] = [
  { rows: 8, cols: 18, dataCapacity: 5, ecCapacity: 7, interleavedBlocks: 1 },
  { rows: 8, cols: 32, dataCapacity: 10, ecCapacity: 11, interleavedBlocks: 1 },
  { rows: 12, cols: 26, dataCapacity: 16, ecCapacity: 14, interleavedBlocks: 1 },
  { rows: 12, cols: 36, dataCapacity: 22, ecCapacity: 18, interleavedBlocks: 1 },
  { rows: 16, cols: 36, dataCapacity: 32, ecCapacity: 24, interleavedBlocks: 1 },
  { rows: 16, cols: 48, dataCapacity: 49, ecCapacity: 28, interleavedBlocks: 1 },
]

/**
 * Data Matrix 编码器
 *
 * 实现 ASCII 模式编码，支持方形和矩形符号
 */
export class DataMatrixEncoder extends Encoder<DataMatrixOptions> {
  getType(): 'datamatrix' {
    return 'datamatrix' as const
  }

  getMaxLength(): number {
    return 1558
  }

  validate(content: string): boolean {
    return content.length > 0 && content.length <= this.getMaxLength()
  }

  encode(content: string, options?: DataMatrixOptions): DotMatrix {
    if (!this.validate(content)) {
      throw new Error(`Invalid Data Matrix content: "${content}"`)
    }

    const shape = options?.shape ?? 'square'

    // 编码数据（ASCII 模式）
    const dataCodewords = this.encodeASCII(content)

    // 选择尺寸
    const sizeInfo = this.selectSize(dataCodewords.length, shape)

    // 填充数据到容量
    const paddedData = this.padData(dataCodewords, sizeInfo.dataCapacity)

    // 计算纠错码（每块独立计算）并交错
    const interleaved = this.encodeWithEC(paddedData, sizeInfo)

    // 构建矩阵
    const matrix = this.buildMatrix(interleaved, sizeInfo)

    return {
      data: matrix,
      width: sizeInfo.cols,
      height: sizeInfo.rows,
      metadata: {
        type: 'datamatrix',
        family: 'matrix',
        generatedAt: Date.now(),
      },
    }
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

  private padData(data: number[], capacity: number): number[] {
    const result = [...data]
    if (result.length < capacity) {
      result.push(129) // 填充开始
    }
    while (result.length < capacity) {
      // 伪随机填充
      const pos = result.length
      const pad = ((149 * pos) % 253) + 130
      result.push(pad > 254 ? pad - 254 : pad)
    }
    return result
  }

  private encodeWithEC(data: number[], sizeInfo: SizeInfo): number[] {
    const blocks = sizeInfo.interleavedBlocks
    const dataLen = sizeInfo.dataCapacity
    const ecLen = sizeInfo.ecCapacity
    const ecPerBlock = Math.floor(ecLen / blocks)

    if (blocks <= 1) {
      // 单块：直接计算 EC
      const ec = calculateReedSolomon(data, ecLen)
      return [...data, ...ec]
    }

    // 多块：每块独立计算 EC
    const dataBlockSizes: number[] = []
    const baseSize = Math.floor(dataLen / blocks)
    const remainder = dataLen % blocks
    for (let i = 0; i < blocks; i++) {
      dataBlockSizes.push(baseSize + (i < remainder ? 1 : 0))
    }

    const dataBlocks: number[][] = []
    const ecBlocks: number[][] = []
    let offset = 0
    for (let i = 0; i < blocks; i++) {
      const blockData = data.slice(offset, offset + dataBlockSizes[i])
      dataBlocks.push(blockData)
      ecBlocks.push(calculateReedSolomon(blockData, ecPerBlock))
      offset += dataBlockSizes[i]
    }

    // 交错数据码字
    const result: number[] = []
    const maxDataSize = Math.max(...dataBlockSizes)
    for (let i = 0; i < maxDataSize; i++) {
      for (let j = 0; j < blocks; j++) {
        if (i < dataBlocks[j].length) {
          result.push(dataBlocks[j][i])
        }
      }
    }

    // 交错 EC 码字
    for (let i = 0; i < ecPerBlock; i++) {
      for (let j = 0; j < blocks; j++) {
        result.push(ecBlocks[j][i])
      }
    }

    return result
  }

  private buildMatrix(codewords: number[], sizeInfo: SizeInfo): DotValue[][] {
    const { rows, cols } = sizeInfo

    // 初始化矩阵
    const matrix: DotValue[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }).fill(0) as DotValue[])

    // 放置边界图案
    this.placeBorderPattern(matrix, rows, cols)

    // 将码字转换为比特流
    const bits: number[] = []
    for (const byte of codewords) {
      for (let i = 7; i >= 0; i--) {
        bits.push((byte >> i) & 1)
      }
    }

    // 放置数据位
    this.placeDataBits(matrix, bits, rows, cols)

    return matrix
  }

  private placeBorderPattern(
    matrix: DotValue[][],
    rows: number,
    cols: number,
  ): void {
    // 底部实线
    for (let c = 0; c < cols; c++) {
      matrix[rows - 1][c] = c % 2 === 0 ? 1 : 0
    }

    // 右侧实线
    for (let r = 0; r < rows; r++) {
      matrix[r][cols - 1] = r % 2 === 0 ? 1 : 0
    }

    // 顶部虚线
    for (let c = 0; c < cols; c++) {
      matrix[0][c] = 1
    }

    // 左侧虚线
    for (let r = 0; r < rows; r++) {
      matrix[r][0] = r % 2 === 0 ? 1 : 0
    }
  }

  private placeDataBits(
    matrix: DotValue[][],
    bits: number[],
    rows: number,
    cols: number,
  ): void {
    let bitIndex = 0

    // Data Matrix 使用 L 形路径放置数据
    // 从左下角开始，按 2x4 块向上放置，然后向右移动再向下
    let row = rows - 2
    let col = 1
    let goingUp = true

    while (bitIndex < bits.length) {
      // 放置 2x4 数据块（2行 x 4列）
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          const curRow = row + r
          const curCol = col + c

          // 跳过边界区域（L形边框和时序图案）
          if (curRow >= 0 && curRow < rows && curCol >= 0 && curCol < cols
            && curRow !== 0 && curRow !== rows - 1
            && curCol !== 0 && curCol !== cols - 1) {
            if (bitIndex < bits.length) {
              matrix[curRow][curCol] = bits[bitIndex] as DotValue
              bitIndex++
            }
          }
        }
      }

      if (goingUp) {
        row -= 2
        if (row < 0) {
          // 到达顶部，向右移动并改变方向
          row = 0
          col += 2
          goingUp = false
        }
      }
      else {
        row += 2
        if (row >= rows) {
          // 到达底部，向右移动并改变方向
          row = rows - 2
          col += 2
          goingUp = true
        }
      }
    }
  }
}
