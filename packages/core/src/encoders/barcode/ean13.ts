import type { CodeType } from '../../types'
import { calculateEANCheckDigit, isValidEAN13 } from '../../utils/validation'
import { BarcodeEncoder } from './base'

// EAN-13 左侧奇偶性编码（L 和 G 交替）
// 前缀数字决定 L/G 模式
const FIRST_DIGIT_PATTERNS: string[] = [
  'LLLLLL', // 0
  'LLGLGG', // 1
  'LLGGLG', // 2
  'LLGGGL', // 3
  'LGLLGG', // 4
  'LGGLLG', // 5
  'LGGGLL', // 6
  'LGLGLG', // 7
  'LGLGGL', // 8
  'LGGLGL', // 9
]

// L 编码（左侧，奇校验）
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

// G 编码（左侧，偶校验）
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

// R 编码（右侧）
const R_ENCODINGS: string[] = [
  '1110010',
  '1100110',
  '1101100',
  '1000010',
  '1011100',
  '1001110',
  '1010000',
  '1000100',
  '1001000',
  '1110100',
]

/**
 * EAN-13 编码器
 */
export class EAN13Encoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'ean13'
  }

  getMaxLength(): number {
    return 13
  }

  validate(content: string): boolean {
    return isValidEAN13(content)
  }

  getModuleCount(_content: string): number {
    // 起始条(3) + 左侧6位(42) + 中间条(5) + 右侧6位(42) + 终止条(3) = 95
    return 95
  }

  encodeToModules(content: string): number[] {
    const digits = this.prepareDigits(content)
    const firstDigit = digits[0]
    const leftDigits = digits.slice(1, 7)
    const rightDigits = digits.slice(7, 13)

    const pattern = FIRST_DIGIT_PATTERNS[firstDigit]
    const bits: string[] = []

    // 起始条
    bits.push('101')

    // 左侧 6 位
    for (let i = 0; i < 6; i++) {
      const digit = leftDigits[i]
      if (pattern[i] === 'L') {
        bits.push(L_ENCODINGS[digit])
      }
      else {
        bits.push(G_ENCODINGS[digit])
      }
    }

    // 中间条
    bits.push('01010')

    // 右侧 6 位
    for (let i = 0; i < 6; i++) {
      bits.push(R_ENCODINGS[rightDigits[i]])
    }

    // 终止条
    bits.push('101')

    // 将比特串转换为模块序列（合并相邻相同值）
    const bitStr = bits.join('')
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

  private prepareDigits(content: string): number[] {
    const digits = content.split('').map(Number)

    if (digits.length === 12) {
      // 自动计算校验位
      const checkDigit = calculateEANCheckDigit(digits)
      digits.push(checkDigit)
    }

    return digits
  }
}
