import type { CodeType } from '../../types'
import { calculateEANCheckDigit, isValidEAN8 } from '../../utils/validation'
import { BarcodeEncoder } from './base'

// EAN-8 左侧编码（L 编码，奇校验）
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

// EAN-8 右侧编码（R 编码）
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
 * EAN-8 编码器
 * 8 位数字（7 位数据 + 1 位校验）
 * 结构: 起始条(3) + 左侧4位(28) + 中间条(5) + 右侧4位(28) + 终止条(3) = 67 模块
 */
export class EAN8Encoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'ean8'
  }

  getMaxLength(): number {
    return 8
  }

  validate(content: string): boolean {
    return isValidEAN8(content)
  }

  encodeToRuns(content: string): number[] {
    const digits = this.prepareDigits(content)
    const leftDigits = digits.slice(0, 4)
    const rightDigits = digits.slice(4, 8)

    const bits: string[] = []

    // 起始条
    bits.push('101')

    // 左侧 4 位（L 编码）
    for (let i = 0; i < 4; i++) {
      bits.push(L_ENCODINGS[leftDigits[i]])
    }

    // 中间条
    bits.push('01010')

    // 右侧 4 位（R 编码）
    for (let i = 0; i < 4; i++) {
      bits.push(R_ENCODINGS[rightDigits[i]])
    }

    // 终止条
    bits.push('101')

    return this.bitsToModules(bits.join(''))
  }

  private prepareDigits(content: string): number[] {
    const digits = content.split('').map(Number)
    if (digits.length === 7) {
      digits.push(calculateEANCheckDigit(digits))
    }
    return digits
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
