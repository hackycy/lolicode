import type { DotMatrix, DotValue, ErrorCorrectionLevel, QRCodeOptions } from '../../types'
import { addMargin } from '../../utils/bit-matrix'
import { getAlphanumericValue, getBytes, isAlphanumeric, isNumeric } from '../../utils/encoding'
import { Encoder } from '../base'
import { applyMask, calculatePenalty } from './mask-patterns'
import { calculateReedSolomon } from './reed-solomon'

// QR Code 版本容量表（数据码字数，按纠错等级）
// 索引: [version-1][errorLevel], errorLevel: L=0, M=1, Q=2, H=3
const DATA_CODEWORDS: number[][] = [
  [19, 16, 13, 9], // V1
  [34, 28, 22, 16], // V2
  [55, 44, 34, 26], // V3
  [80, 64, 48, 36], // V4
  [108, 86, 62, 46], // V5
  [136, 108, 76, 60], // V6
  [156, 124, 88, 66], // V7
  [194, 154, 110, 86], // V8
  [232, 182, 132, 100], // V9
  [274, 216, 154, 122], // V10
  [324, 254, 180, 140], // V11
  [370, 290, 206, 158], // V12
  [428, 334, 244, 180], // V13
  [461, 365, 261, 197], // V14
  [523, 415, 295, 223], // V15
  [589, 453, 325, 253], // V16
  [647, 507, 367, 283], // V17
  [721, 563, 397, 313], // V18
  [795, 627, 445, 341], // V19
  [861, 669, 485, 385], // V20
  [932, 714, 512, 406], // V21
  [1006, 782, 568, 442], // V22
  [1094, 860, 614, 464], // V23
  [1174, 914, 664, 514], // V24
  [1276, 1000, 718, 538], // V25
  [1370, 1062, 754, 596], // V26
  [1468, 1128, 808, 628], // V27
  [1531, 1193, 871, 661], // V28
  [1631, 1267, 911, 701], // V29
  [1735, 1373, 985, 745], // V30
  [1843, 1455, 1033, 793], // V31
  [1955, 1541, 1115, 845], // V32
  [2071, 1631, 1171, 901], // V33
  [2191, 1725, 1231, 961], // V34
  [2306, 1812, 1286, 986], // V35
  [2434, 1914, 1354, 1054], // V36
  [2566, 1992, 1426, 1096], // V37
  [2702, 2102, 1502, 1142], // V38
  [2812, 2216, 1582, 1222], // V39
  [2956, 2334, 1666, 1276], // V40
]

// 纠错码字数（每个 EC Block）
const EC_CODEWORDS_PER_BLOCK: number[][] = [
  [7, 10, 13, 17], // V1
  [10, 16, 22, 28], // V2
  [15, 26, 18, 22], // V3
  [20, 18, 26, 16], // V4
  [26, 24, 18, 22], // V5
  [18, 16, 24, 28], // V6
  [20, 18, 18, 26], // V7
  [24, 22, 22, 26], // V8
  [30, 22, 20, 24], // V9
  [18, 26, 24, 28], // V10
  [20, 30, 28, 24], // V11
  [24, 22, 26, 28], // V12
  [26, 22, 24, 22], // V13
  [30, 24, 20, 24], // V14
  [22, 24, 30, 24], // V15
  [24, 28, 24, 30], // V16
  [28, 28, 28, 28], // V17
  [30, 26, 28, 28], // V18
  [28, 26, 26, 26], // V19
  [28, 26, 28, 28], // V20
  [28, 26, 28, 30], // V21
  [28, 28, 28, 24], // V22
  [30, 28, 28, 30], // V23
  [30, 28, 28, 30], // V24
  [26, 28, 28, 30], // V25
  [28, 28, 28, 28], // V26
  [30, 28, 28, 30], // V27
  [30, 28, 28, 30], // V28
  [30, 28, 28, 30], // V29
  [30, 28, 28, 30], // V30
  [30, 28, 28, 30], // V31
  [30, 28, 28, 30], // V32
  [30, 28, 28, 30], // V33
  [30, 28, 28, 30], // V34
  [30, 28, 28, 30], // V35
  [30, 28, 28, 30], // V36
  [30, 28, 28, 30], // V37
  [30, 28, 28, 30], // V38
  [30, 28, 28, 30], // V39
  [30, 28, 28, 30], // V40
]

// 纠错块数量，索引: [version-1][errorLevel]
const EC_BLOCKS_COUNT: number[][] = [
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 2, 2],
  [1, 2, 2, 4],
  [1, 2, 4, 4],
  [2, 4, 4, 4],
  [2, 4, 6, 5],
  [2, 4, 6, 6],
  [2, 5, 8, 8],
  [4, 5, 8, 8],
  [4, 5, 8, 11],
  [4, 8, 10, 11],
  [4, 9, 12, 16],
  [4, 9, 16, 16],
  [6, 10, 12, 18],
  [6, 10, 17, 16],
  [6, 11, 16, 19],
  [6, 13, 18, 21],
  [7, 14, 21, 25],
  [8, 16, 20, 25],
  [8, 17, 23, 25],
  [9, 17, 23, 34],
  [9, 18, 25, 30],
  [10, 20, 27, 32],
  [12, 21, 29, 35],
  [12, 23, 34, 37],
  [12, 25, 34, 40],
  [13, 26, 35, 42],
  [14, 28, 38, 45],
  [15, 29, 40, 48],
  [16, 31, 43, 51],
  [17, 33, 45, 54],
  [18, 35, 48, 57],
  [19, 37, 51, 60],
  [19, 38, 53, 63],
  [20, 40, 56, 66],
  [21, 43, 59, 70],
  [22, 45, 62, 74],
  [24, 47, 65, 77],
  [25, 49, 68, 81],
]

// 对齐图案位置
const ALIGNMENT_POSITIONS: number[][] = [
  [], // V1
  [6, 18], // V2
  [6, 22], // V3
  [6, 26], // V4
  [6, 30], // V5
  [6, 34], // V6
  [6, 22, 38], // V7
  [6, 24, 42], // V8
  [6, 26, 46], // V9
  [6, 28, 50], // V10
  [6, 30, 54], // V11
  [6, 32, 58], // V12
  [6, 34, 62], // V13
  [6, 26, 46, 66], // V14
  [6, 26, 48, 70], // V15
  [6, 26, 50, 74], // V16
  [6, 30, 54, 78], // V17
  [6, 30, 56, 82], // V18
  [6, 30, 58, 86], // V19
  [6, 34, 62, 90], // V20
  [6, 28, 50, 72, 94], // V21
  [6, 26, 50, 74, 98], // V22
  [6, 30, 54, 78, 102], // V23
  [6, 28, 54, 80, 106], // V24
  [6, 32, 58, 84, 110], // V25
  [6, 30, 58, 86, 114], // V26
  [6, 34, 62, 90, 118], // V27
  [6, 26, 50, 74, 98, 122], // V28
  [6, 30, 54, 78, 102, 126], // V29
  [6, 26, 52, 78, 104, 130], // V30
  [6, 30, 56, 82, 108, 134], // V31
  [6, 34, 60, 86, 112, 138], // V32
  [6, 30, 58, 86, 114, 142], // V33
  [6, 34, 62, 90, 118, 146], // V34
  [6, 30, 54, 78, 102, 126, 150], // V35
  [6, 24, 50, 76, 102, 128, 154], // V36
  [6, 28, 54, 80, 106, 132, 158], // V37
  [6, 32, 58, 84, 110, 136, 162], // V38
  [6, 26, 54, 82, 110, 138, 166], // V39
  [6, 30, 58, 86, 114, 142, 170], // V40
]

const EC_LEVEL_MAP: Record<ErrorCorrectionLevel, number> = {
  L: 0,
  M: 1,
  Q: 2,
  H: 3,
}

// QR 标准格式信息中的 EC 等级编码
const EC_FORMAT_MAP: Record<ErrorCorrectionLevel, number> = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
}

/**
 * QR Code 编码器
 */
export class QREncoder extends Encoder<QRCodeOptions> {
  getType(): 'qrcode' {
    return 'qrcode' as const
  }

  getMaxLength(): number {
    return 2953 // V40-H 的字节容量
  }

  validate(content: string): boolean {
    return content.length > 0 && content.length <= this.getMaxLength()
  }

  encode(content: string, options?: QRCodeOptions): DotMatrix {
    if (!this.validate(content)) {
      throw new Error(`Invalid QR Code content: "${content.substring(0, 50)}..."`)
    }

    const errorLevel = options?.errorLevel ?? 'M'
    const ecLevel = EC_LEVEL_MAP[errorLevel]
    const requestedVersion = options?.version
    const requestedMask = options?.maskPattern
    if (requestedMask !== undefined && (requestedMask < 0 || requestedMask > 7)) {
      throw new Error(`Invalid QR mask pattern: ${requestedMask}`)
    }

    // 选择编码模式
    const mode = options?.mode ?? this.detectMode(content)

    // 计算数据比特
    const dataBits = this.encodeData(content, mode)

    // 选择版本
    const version = requestedVersion ?? this.selectVersion(dataBits.length, ecLevel, mode)
    if (version < 1 || version > 40) {
      throw new Error(`Invalid QR version: ${version}`)
    }

    const totalDataCodewords = DATA_CODEWORDS[version - 1][ecLevel]

    // 添加模式指示符和字符计数指示符
    const modeIndicator = this.getModeIndicator(mode)
    const charCountBits = this.getCharCountBits(version, mode)

    const bitStream: number[] = []
    // 模式指示符 (4 bits)
    for (let i = 3; i >= 0; i--) {
      bitStream.push((modeIndicator >> i) & 1)
    }
    // 字符计数
    const charCount = mode === 'byte' ? getBytes(content).length : content.length
    for (let i = charCountBits - 1; i >= 0; i--) {
      bitStream.push((charCount >> i) & 1)
    }
    // 数据
    bitStream.push(...dataBits)

    const totalBits = totalDataCodewords * 8
    if (bitStream.length > totalBits) {
      throw new Error(`Data too long for QR Code version ${version} with error level ${errorLevel}`)
    }

    // 终止符 (最多 4 个 0)
    const terminatorLength = Math.min(4, totalBits - bitStream.length)
    for (let i = 0; i < terminatorLength; i++) {
      bitStream.push(0)
    }

    // 填充到字节边界
    while (bitStream.length % 8 !== 0) {
      bitStream.push(0)
    }

    // 填充码字
    const padBytes = [0xEC, 0x11]
    let padIndex = 0
    while (bitStream.length < totalBits) {
      const byte = padBytes[padIndex % 2]
      for (let i = 7; i >= 0; i--) {
        bitStream.push((byte >> i) & 1)
      }
      padIndex++
    }

    // 转换为码字
    const dataCodewords: number[] = []
    for (let i = 0; i < bitStream.length; i += 8) {
      let byte = 0
      for (let j = 0; j < 8; j++) {
        byte = (byte << 1) | (bitStream[i + j] ?? 0)
      }
      dataCodewords.push(byte)
    }

    // 纠错编码
    const ecBlocks = this.encodeErrorCorrection(dataCodewords, version, ecLevel)

    // 构建最终码字序列
    const finalCodewords = this.interleaveBlocks(ecBlocks, version, ecLevel)

    // 构建矩阵
    const matrixSize = version * 4 + 17
    const matrix: DotValue[][] = Array.from({ length: matrixSize }, () =>
      Array.from({ length: matrixSize }, (): DotValue => 0))
    const isFunction: boolean[][] = Array.from({ length: matrixSize }, () =>
      Array.from({ length: matrixSize }, (): boolean => false))

    // 放置功能图案
    this.placeFinderPatterns(matrix, isFunction, matrixSize)
    this.placeAlignmentPatterns(matrix, isFunction, version, matrixSize)
    this.placeTimingPatterns(matrix, isFunction, matrixSize)
    this.placeDarkModule(matrix, isFunction, version)

    // 保留格式信息区域
    this.reserveFormatInfo(isFunction, matrixSize)
    if (version >= 7) {
      this.reserveVersionInfo(isFunction, matrixSize)
    }

    // 放置数据
    this.placeData(matrix, isFunction, finalCodewords, matrixSize)

    // 选择并应用最佳掩码
    let bestMask = 0
    let bestPenalty = Infinity
    const maskRange = requestedMask !== undefined ? [requestedMask] : [0, 1, 2, 3, 4, 5, 6, 7]

    for (const mask of maskRange) {
      const masked = applyMask(matrix, isFunction, mask)
      this.placeFormatInfo(masked, errorLevel, mask)
      if (version >= 7) {
        this.placeVersionInfo(masked, version)
      }
      const penalty = calculatePenalty(masked)
      if (penalty < bestPenalty) {
        bestPenalty = penalty
        bestMask = mask
      }
    }

    const result = applyMask(matrix, isFunction, bestMask)
    this.placeFormatInfo(result, errorLevel, bestMask)
    if (version >= 7) {
      this.placeVersionInfo(result, version)
    }

    const dotMatrix: DotMatrix = {
      data: result,
      width: matrixSize,
      height: matrixSize,
      metadata: {
        type: 'qrcode',
        version,
        errorLevel,
        generatedAt: Date.now(),
      },
    }

    const margin = options?.margin ?? 4
    return margin > 0 ? addMargin(dotMatrix, margin) : dotMatrix
  }

  private detectMode(content: string): 'numeric' | 'alphanumeric' | 'byte' {
    if (isNumeric(content))
      return 'numeric'
    if (isAlphanumeric(content))
      return 'alphanumeric'
    return 'byte'
  }

  private getModeIndicator(mode: string): number {
    switch (mode) {
      case 'numeric': return 0b0001
      case 'alphanumeric': return 0b0010
      case 'byte': return 0b0100
      case 'kanji': return 0b1000
      default: return 0b0100
    }
  }

  private getCharCountBits(version: number, mode: string): number {
    const idx = version <= 9 ? 0 : version <= 26 ? 1 : 2
    const counts: Record<string, number[]> = {
      numeric: [10, 12, 14],
      alphanumeric: [9, 11, 13],
      byte: [8, 16, 16],
      kanji: [8, 10, 12],
    }
    return counts[mode]?.[idx] ?? 8
  }

  private encodeData(content: string, mode: string): number[] {
    switch (mode) {
      case 'numeric':
        return this.encodeNumeric(content)
      case 'alphanumeric':
        return this.encodeAlphanumeric(content)
      case 'byte':
        return this.encodeByte(content)
      default:
        return this.encodeByte(content)
    }
  }

  private encodeNumeric(content: string): number[] {
    const bits: number[] = []
    for (let i = 0; i < content.length; i += 3) {
      const group = content.substring(i, i + 3)
      const num = Number.parseInt(group, 10)
      const bitLen = group.length === 3 ? 10 : group.length === 2 ? 7 : 4
      for (let j = bitLen - 1; j >= 0; j--) {
        bits.push((num >> j) & 1)
      }
    }
    return bits
  }

  private encodeAlphanumeric(content: string): number[] {
    const bits: number[] = []
    for (let i = 0; i < content.length; i += 2) {
      if (i + 1 < content.length) {
        const val = getAlphanumericValue(content[i]) * 45 + getAlphanumericValue(content[i + 1])
        for (let j = 10; j >= 0; j--) {
          bits.push((val >> j) & 1)
        }
      }
      else {
        const val = getAlphanumericValue(content[i])
        for (let j = 5; j >= 0; j--) {
          bits.push((val >> j) & 1)
        }
      }
    }
    return bits
  }

  private encodeByte(content: string): number[] {
    const bytes = getBytes(content)
    const bits: number[] = []
    for (const byte of bytes) {
      for (let j = 7; j >= 0; j--) {
        bits.push((byte >> j) & 1)
      }
    }
    return bits
  }

  private selectVersion(dataBits: number, ecLevel: number, mode: string): number {
    for (let v = 1; v <= 40; v++) {
      const charCountBits = this.getCharCountBits(v, mode)
      const totalBits = 4 + charCountBits + dataBits
      const capacity = DATA_CODEWORDS[v - 1][ecLevel] * 8
      if (totalBits <= capacity)
        return v
    }
    throw new Error('Data too long for QR Code')
  }

  private encodeErrorCorrection(
    dataCodewords: number[],
    version: number,
    ecLevel: number,
  ): number[][] {
    const blockDataLengths = this.getBlockDataLengths(version, ecLevel)
    const ecPerBlock = EC_CODEWORDS_PER_BLOCK[version - 1][ecLevel]

    const result: number[][] = []
    let offset = 0

    for (const dataLength of blockDataLengths) {
      const blockData = dataCodewords.slice(offset, offset + dataLength)
      const ecData = calculateReedSolomon(blockData, ecPerBlock)
      result.push([...blockData, ...ecData])
      offset += dataLength
    }

    return result
  }

  private interleaveBlocks(
    blocks: number[][],
    version: number,
    ecLevel: number,
  ): number[] {
    const blockDataLengths = this.getBlockDataLengths(version, ecLevel)
    const ecPerBlock = EC_CODEWORDS_PER_BLOCK[version - 1][ecLevel]
    const maxDataLength = Math.max(...blockDataLengths)

    const result: number[] = []

    // 交错数据码字
    for (let i = 0; i < maxDataLength; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i < blockDataLengths[j]) {
          result.push(blocks[j][i])
        }
      }
    }

    // 交错纠错码字
    for (let i = 0; i < ecPerBlock; i++) {
      for (let j = 0; j < blocks.length; j++) {
        result.push(blocks[j][blockDataLengths[j] + i])
      }
    }

    return result
  }

  private getBlockDataLengths(version: number, ecLevel: number): number[] {
    const totalBlocks = EC_BLOCKS_COUNT[version - 1][ecLevel]
    const totalDataCodewords = DATA_CODEWORDS[version - 1][ecLevel]
    const shortBlockLength = Math.floor(totalDataCodewords / totalBlocks)
    const longBlockCount = totalDataCodewords % totalBlocks
    const shortBlockCount = totalBlocks - longBlockCount

    return Array.from({ length: totalBlocks }, (_unused, index) =>
      index < shortBlockCount ? shortBlockLength : shortBlockLength + 1)
  }

  private placeFinderPatterns(
    matrix: DotValue[][],
    isFunction: boolean[][],
    size: number,
  ): void {
    const pattern = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ]

    const positions = [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ]

    for (const [row, col] of positions) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          matrix[row + r][col + c] = pattern[r][c] as DotValue
          isFunction[row + r][col + c] = true
        }
      }
    }

    // 分隔符
    for (let i = 0; i < 8; i++) {
      // 左上
      if (i < size) {
        this.setFunction(matrix, isFunction, 7, i, 0, size)
        this.setFunction(matrix, isFunction, i, 7, 0, size)
      }
      // 右上
      if (i < size) {
        this.setFunction(matrix, isFunction, 7, size - 8 + i, 0, size)
        this.setFunction(matrix, isFunction, i, size - 8, 0, size)
      }
      // 左下
      if (i < size) {
        this.setFunction(matrix, isFunction, size - 8, i, 0, size)
        this.setFunction(matrix, isFunction, size - 8 + i, 7, 0, size)
      }
    }
  }

  private setFunction(
    matrix: DotValue[][],
    isFunction: boolean[][],
    row: number,
    col: number,
    value: number,
    size: number,
  ): void {
    if (row >= 0 && row < size && col >= 0 && col < size) {
      matrix[row][col] = value as DotValue
      isFunction[row][col] = true
    }
  }

  private placeAlignmentPatterns(
    matrix: DotValue[][],
    isFunction: boolean[][],
    version: number,
    size: number,
  ): void {
    if (version === 1)
      return

    const positions = ALIGNMENT_POSITIONS[version - 1]

    for (const row of positions) {
      for (const col of positions) {
        // 跳过与查找器图案重叠的位置
        if (row <= 8 && col <= 8)
          continue
        if (row <= 8 && col >= size - 8)
          continue
        if (row >= size - 8 && col <= 8)
          continue

        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const val = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) ? 1 : 0
            matrix[row + r][col + c] = val as DotValue
            isFunction[row + r][col + c] = true
          }
        }
      }
    }
  }

  private placeTimingPatterns(
    matrix: DotValue[][],
    isFunction: boolean[][],
    size: number,
  ): void {
    for (let i = 8; i < size - 8; i++) {
      const val = (i % 2 === 0) ? 1 : 0
      // 水平
      if (!isFunction[6][i]) {
        matrix[6][i] = val as DotValue
        isFunction[6][i] = true
      }
      // 垂直
      if (!isFunction[i][6]) {
        matrix[i][6] = val as DotValue
        isFunction[i][6] = true
      }
    }
  }

  private placeDarkModule(
    matrix: DotValue[][],
    isFunction: boolean[][],
    version: number,
  ): void {
    const row = version * 4 + 9
    matrix[row][8] = 1
    isFunction[row][8] = true
  }

  private reserveFormatInfo(
    isFunction: boolean[][],
    size: number,
  ): void {
    for (let i = 0; i < 15; i++) {
      if (i < 6) {
        isFunction[i][8] = true
      }
      else if (i < 8) {
        isFunction[i + 1][8] = true
      }
      else {
        isFunction[size - 15 + i][8] = true
      }

      if (i < 8) {
        isFunction[8][size - i - 1] = true
      }
      else if (i < 9) {
        isFunction[8][15 - i] = true
      }
      else {
        isFunction[8][14 - i] = true
      }
    }

    isFunction[size - 8][8] = true
  }

  private reserveVersionInfo(
    isFunction: boolean[][],
    size: number,
  ): void {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        isFunction[i][size - 11 + j] = true
        isFunction[size - 11 + j][i] = true
      }
    }
  }

  private placeData(
    matrix: DotValue[][],
    isFunction: boolean[][],
    data: number[],
    size: number,
  ): void {
    let bitIndex = 0
    const totalBits = data.length * 8

    // 从右下角开始，向上螺旋
    let col = size - 1
    let direction = -1 // -1 = 向上, 1 = 向下

    while (col > 0) {
      if (col === 6)
        col-- // 跳过垂直时序图案

      for (let row = (direction === -1 ? size - 1 : 0);
        direction === -1 ? row >= 0 : row < size;
        row += direction) {
        for (let c = 0; c < 2; c++) {
          const currentCol = col - c
          if (currentCol < 0 || currentCol >= size)
            continue

          if (isFunction[row][currentCol])
            continue

          if (bitIndex < totalBits) {
            const byteIndex = Math.floor(bitIndex / 8)
            const bitOffset = 7 - (bitIndex % 8)
            matrix[row][currentCol] = ((data[byteIndex] >> bitOffset) & 1) as DotValue
            bitIndex++
          }
        }
      }

      col -= 2
      direction *= -1
    }
  }

  private placeFormatInfo(
    matrix: DotValue[][],
    errorLevel: ErrorCorrectionLevel,
    mask: number,
  ): void {
    const ecLevel = EC_FORMAT_MAP[errorLevel]
    const formatInfo = this.calculateFormatInfo(ecLevel, mask)

    const size = matrix.length

    for (let i = 0; i < 15; i++) {
      const bit = ((formatInfo >> i) & 1) as DotValue

      if (i < 6) {
        matrix[i][8] = bit
      }
      else if (i < 8) {
        matrix[i + 1][8] = bit
      }
      else {
        matrix[size - 15 + i][8] = bit
      }

      if (i < 8) {
        matrix[8][size - i - 1] = bit
      }
      else if (i < 9) {
        matrix[8][15 - i] = bit
      }
      else {
        matrix[8][14 - i] = bit
      }
    }

    matrix[size - 8][8] = 1
  }

  private calculateFormatInfo(ecLevel: number, mask: number): number {
    const data = (ecLevel << 3) | mask
    let bits = data << 10
    const gen = 0b10100110111

    for (let i = 4; i >= 0; i--) {
      if (bits & (1 << (i + 10))) {
        bits ^= gen << i
      }
    }

    const formatInfo = (data << 10) | bits
    return formatInfo ^ 0b101010000010010
  }

  private placeVersionInfo(
    matrix: DotValue[][],
    version: number,
  ): void {
    if (version < 7)
      return

    let bits = version << 12
    const gen = 0b1111100100101

    for (let i = 5; i >= 0; i--) {
      if (bits & (1 << (i + 12))) {
        bits ^= gen << i
      }
    }

    const versionInfo = (version << 12) | bits
    const size = matrix.length

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        const bit = (versionInfo >> (i * 3 + j)) & 1
        matrix[i][size - 11 + j] = bit as DotValue
        matrix[size - 11 + j][i] = bit as DotValue
      }
    }
  }
}
