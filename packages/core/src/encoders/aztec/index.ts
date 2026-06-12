import type { BaseEncodeOptions, CodeType, DotMatrix, DotValue } from '../../types'
import { Encoder } from '../base'
import { calculateReedSolomon } from '../qrcode/reed-solomon'

// Aztec Compact 编码参数
// 层数 -> 矩阵大小、数据容量（bit）、EC 容量（bit）
const COMPACT_SIZES = [
  { layers: 1, size: 15, dataBits: 16, ecBits: 6 },
  { layers: 2, size: 19, dataBits: 40, ecBits: 12 },
  { layers: 3, size: 23, dataBits: 68, ecBits: 18 },
  { layers: 4, size: 27, dataBits: 100, ecBits: 24 },
]

// 查找模式（bulls-eye 中心 11x11）
// 内核: 黑白交替的同心方块
const FINDER_PATTERN_SIZE = 11

// 字符编码表：支持数字、大写字母、小写字母
// 每个字符用 5 bit 编码
function charToBits(ch: string): number | null {
  const code = ch.charCodeAt(0)
  // 数字 0-9 -> 0-9
  if (code >= 48 && code <= 57)
    return code - 48
  // 大写字母 A-Z -> 10-35
  if (code >= 65 && code <= 90)
    return code - 55
  // 小写字母 a-z -> 36-61
  if (code >= 97 && code <= 122)
    return code - 61
  // 空格 -> 62
  if (code === 32)
    return 62
  return null
}

/**
 * Aztec Code 编码器
 * 用于机票、运输票据等
 * 支持 Compact Aztec（4 种大小）
 */
export class AztecEncoder extends Encoder<BaseEncodeOptions> {
  getType(): CodeType {
    return 'aztec'
  }

  getMaxLength(): number {
    return 50
  }

  validate(content: string): boolean {
    if (content.length === 0 || content.length > this.getMaxLength())
      return false
    for (let i = 0; i < content.length; i++) {
      if (charToBits(content[i]) === null)
        return false
    }
    return true
  }

  encode(content: string, options?: BaseEncodeOptions): DotMatrix {
    if (!this.validate(content))
      throw new Error(`Invalid Aztec content: ${content}`)

    const bits = this.encodeToBits(content)
    const sizeInfo = this.selectSize(bits.length)
    if (!sizeInfo)
      throw new Error('Content too long for Aztec Compact')

    const { layers, size, dataBits, ecBits } = sizeInfo
    const matrix = this.createMatrix(size)

    // 1. 绘制查找模式（bulls-eye）
    this.drawFinderPattern(matrix, size)

    // 2. 编码数据位 + EC
    const dataWithEC = this.addErrorCorrection(bits, dataBits, ecBits)

    // 3. 绘制模式信息（4 个角）
    this.drawModeMessage(matrix, size, layers, ecBits)

    // 4. 放置数据位
    this.placeData(matrix, size, layers, dataWithEC)

    const margin = options?.margin ?? 2
    return this.buildDotMatrix(matrix, content, margin)
  }

  private encodeToBits(content: string): number[] {
    const bits: number[] = []
    for (const ch of content) {
      const val = charToBits(ch)
      if (val === null)
        throw new Error(`Cannot encode character: ${ch}`)
      // 5 bit per character
      for (let i = 4; i >= 0; i--) {
        bits.push((val >> i) & 1)
      }
    }
    return bits
  }

  private selectSize(bitCount: number): typeof COMPACT_SIZES[number] | null {
    for (const sizeInfo of COMPACT_SIZES) {
      if (bitCount <= sizeInfo.dataBits)
        return sizeInfo
    }
    return null
  }

  private createMatrix(size: number): number[][] {
    return Array.from({ length: size }, (): number[] =>
      Array.from({ length: size }, () => 0))
  }

  private drawFinderPattern(matrix: number[][], size: number): void {
    const center = Math.floor(size / 2)
    const half = Math.floor(FINDER_PATTERN_SIZE / 2)

    // 绘制同心方块：黑-白-黑-白-黑
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        // 奇数层 = 黑色，偶数层 = 白色
        const value = dist % 2 === 0 ? 1 : 0
        const y = center + dy
        const x = center + dx
        if (y >= 0 && y < size && x >= 0 && x < size)
          matrix[y][x] = value
      }
    }
  }

  private drawModeMessage(matrix: number[][], size: number, layers: number, ecBits: number): void {
    // 模式信息：5 bit（层数 4 bit + EC 标志 1 bit）
    const ecFlag = ecBits > 12 ? 1 : 0
    const modeBits = ((layers - 1) << 1) | ecFlag

    // 在四个角放置模式信息
    // 左上角：水平放置
    for (let i = 0; i < 5; i++) {
      const bit = (modeBits >> (4 - i)) & 1
      if (i < FINDER_PATTERN_SIZE) {
        matrix[0][i + 1] = bit
      }
    }
    // 右上角：垂直放置
    for (let i = 0; i < 5; i++) {
      const bit = (modeBits >> (4 - i)) & 1
      if (i < FINDER_PATTERN_SIZE) {
        matrix[i + 1][size - 1] = bit
      }
    }
    // 右下角：水平放置（反向）
    for (let i = 0; i < 5; i++) {
      const bit = (modeBits >> (4 - i)) & 1
      if (i < FINDER_PATTERN_SIZE) {
        matrix[size - 1][size - 2 - i] = bit
      }
    }
    // 左下角：垂直放置（反向）
    for (let i = 0; i < 5; i++) {
      const bit = (modeBits >> (4 - i)) & 1
      if (i < FINDER_PATTERN_SIZE) {
        matrix[size - 2 - i][0] = bit
      }
    }
  }

  private addErrorCorrection(dataBits: number[], dataCapacity: number, ecCapacity: number): number[] {
    // 填充到 dataCapacity
    const padded = [...dataBits]
    while (padded.length < dataCapacity) {
      padded.push(0)
    }

    // 转换为字节数组
    const dataBytes = this.bitsToBytes(padded.slice(0, dataCapacity))

    // 计算 EC
    const ecByteCount = Math.ceil(ecCapacity / 8)
    const ecBytes = calculateReedSolomon(dataBytes, ecByteCount)

    // 合并 data + EC
    const allBits = [...padded.slice(0, dataCapacity)]
    for (const byte of ecBytes) {
      for (let i = 7; i >= 0; i--) {
        allBits.push((byte >> i) & 1)
      }
    }

    return allBits.slice(0, dataCapacity + ecCapacity)
  }

  private bitsToBytes(bits: number[]): number[] {
    const bytes: number[] = []
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0
      for (let j = 0; j < 8 && i + j < bits.length; j++) {
        byte = (byte << 1) | bits[i + j]
      }
      bytes.push(byte)
    }
    return bytes
  }

  private placeData(matrix: number[][], size: number, layers: number, data: number[]): void {
    const center = Math.floor(size / 2)
    let bitIndex = 0

    // 从中心向外逐层放置数据
    // 每层从右上角开始，顺时针螺旋
    for (let layer = 1; layer <= layers && bitIndex < data.length; layer++) {
      const radius = Math.floor(FINDER_PATTERN_SIZE / 2) + layer

      // 上边：从右到左
      for (let dx = radius; dx >= -radius && bitIndex < data.length; dx--) {
        const y = center - radius
        const x = center + dx
        if (y >= 0 && y < size && x >= 0 && x < size && !this.isFinderArea(x, y, center)) {
          matrix[y][x] = data[bitIndex++]
        }
      }

      // 左边：从上到下
      for (let dy = -radius + 1; dy <= radius && bitIndex < data.length; dy++) {
        const y = center + dy
        const x = center - radius
        if (y >= 0 && y < size && x >= 0 && x < size && !this.isFinderArea(x, y, center)) {
          matrix[y][x] = data[bitIndex++]
        }
      }

      // 下边：从左到右
      for (let dx = -radius + 1; dx <= radius && bitIndex < data.length; dx++) {
        const y = center + radius
        const x = center + dx
        if (y >= 0 && y < size && x >= 0 && x < size && !this.isFinderArea(x, y, center)) {
          matrix[y][x] = data[bitIndex++]
        }
      }

      // 右边：从下到上
      for (let dy = radius - 1; dy >= -radius + 1 && bitIndex < data.length; dy--) {
        const y = center + dy
        const x = center + radius
        if (y >= 0 && y < size && x >= 0 && x < size && !this.isFinderArea(x, y, center)) {
          matrix[y][x] = data[bitIndex++]
        }
      }
    }
  }

  private isFinderArea(x: number, y: number, center: number): boolean {
    const half = Math.floor(FINDER_PATTERN_SIZE / 2)
    return Math.abs(x - center) <= half && Math.abs(y - center) <= half
  }

  private buildDotMatrix(matrix: number[][], content: string, margin: number): DotMatrix {
    // 添加边距
    const innerHeight = matrix.length
    const innerWidth = matrix[0].length
    const width = innerWidth + margin * 2
    const height = innerHeight + margin * 2

    const data: DotValue[][] = Array.from(
      { length: height },
      (): DotValue[] => Array.from({ length: width }, () => 0),
    )

    for (let y = 0; y < innerHeight; y++) {
      for (let x = 0; x < innerWidth; x++) {
        data[y + margin][x + margin] = matrix[y][x] as DotValue
      }
    }

    return {
      data,
      width,
      height,
      metadata: {
        type: 'aztec',
        contentLength: content.length,
        generatedAt: Date.now(),
      },
    }
  }
}
