import type { CodeType } from '../../types'
import { calculateEANCheckDigit } from '../../utils/validation'
import { BarcodeEncoder } from './base'

// 简化 UPC-E 编码：使用 EAN-13 的 L 和 G 编码表
const L_ENCODINGS: string[] = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
]

const G_ENCODINGS: string[] = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
]

/**
 * UPC-E 编码器
 * UPC-E 是 UPC-A 的压缩形式，用于小型商品
 * 6 位数据 + 1 位校验（隐含）
 * 结构: 起始条(3) + 6位数据(42) + 终止条(6) = 51 模块
 */
export class UPCEncoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'upce'
  }

  getMaxLength(): number {
    return 8
  }

  validate(content: string): boolean {
    if (!/^\d+$/.test(content))
      return false
    return content.length >= 6 && content.length <= 8
  }

  getModuleCount(_content: string): number {
    return 51
  }

  encodeToModules(content: string): number[] {
    const digits = this.prepareDigits(content)
    const lastDigit = digits[digits.length - 1]

    // UPC-E 编码规则：根据最后一位数字决定每个数据位使用 L 或 G 编码
    const encodingPattern = this.getEncodingPattern(lastDigit)
    const dataDigits = digits.slice(0, 6)

    const bits: string[] = []

    // 起始条
    bits.push('101')

    // 6 位数据
    for (let i = 0; i < 6; i++) {
      const digit = dataDigits[i]
      if (encodingPattern[i] === 'E') {
        bits.push(L_ENCODINGS[digit])
      }
      else {
        bits.push(G_ENCODINGS[digit])
      }
    }

    // 终止条
    bits.push('010101')

    return this.bitsToModules(bits.join(''))
  }

  private prepareDigits(content: string): number[] {
    const digits = content.split('').map(Number)

    if (digits.length === 6) {
      // 需要计算校验位 - 先转换为 UPC-A 格式
      const upcaDigits = this.expandToUPCA(digits)
      const checkDigit = calculateEANCheckDigit(upcaDigits)
      digits.push(checkDigit)
    }
    else if (digits.length === 7) {
      // 已有校验位
    }
    else if (digits.length === 8) {
      // 完整格式，取后 7 位
      return digits.slice(1, 8)
    }

    return digits
  }

  private expandToUPCA(digits: number[]): number[] {
    // UPC-E 到 UPC-A 的转换
    // digits: 6 位数据 + 1 位校验 = 7 位
    // 展开规则基于校验位（第 7 位）
    const checkDigit = digits[6]
    const d = digits.slice(0, 6)

    switch (checkDigit) {
      case 0:
      case 1:
      case 2:
        // 0 MMM 0000 0PP X (制造商 3 位, 产品 2 位)
        return `0${d[0]}${d[1]}${d[2]}${checkDigit}00000${d[3]}${d[4]}`.split('').map(Number)
      case 3:
        // 0 MMM 00000 PP X (制造商 3 位, 产品 2 位)
        return `0${d[0]}${d[1]}${d[2]}00000${d[3]}${d[4]}`.split('').map(Number)
      case 4:
        // 0 MMMM 0000 P X (制造商 4 位, 产品 1 位)
        return `0${d[0]}${d[1]}${d[2]}${d[3]}0000${d[4]}`.split('').map(Number)
      default:
        // 0 MMMMM 0000 P X (制造商 5 位, 产品 1 位)
        return `0${d[0]}${d[1]}${d[2]}${d[3]}${d[4]}0000${d[5]}`.split('').map(Number)
    }
  }

  private getEncodingPattern(lastDigit: number): string[] {
    // 根据最后一位数字选择编码模式
    // E = L 编码, G = G 编码
    const patterns: string[][] = [
      ['E', 'E', 'E', 'O', 'O', 'O'], // 0
      ['E', 'E', 'O', 'E', 'O', 'O'], // 1
      ['E', 'E', 'O', 'O', 'E', 'O'], // 2
      ['E', 'E', 'O', 'O', 'O', 'E'], // 3
      ['E', 'O', 'E', 'E', 'O', 'O'], // 4
      ['E', 'O', 'O', 'E', 'E', 'O'], // 5
      ['E', 'O', 'O', 'O', 'E', 'E'], // 6
      ['E', 'O', 'E', 'O', 'E', 'O'], // 7
      ['E', 'O', 'E', 'O', 'O', 'E'], // 8
      ['E', 'O', 'O', 'E', 'O', 'E'], // 9
    ]
    return patterns[lastDigit] || patterns[0]
  }

  private bitsToModules(bitStr: string): number[] {
    const modules: number[] = []
    let current = bitStr[0]
    let count = 1

    for (let i = 1; i < bitStr.length; i++) {
      if (bitStr[i] === current) {
        count++
      }
      else {
        modules.push(count)
        current = bitStr[i]
        count = 1
      }
    }
    modules.push(count)
    return modules
  }
}
