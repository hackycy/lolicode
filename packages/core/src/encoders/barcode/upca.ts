import type { CodeType } from '../../types'
import { calculateEANCheckDigit, isValidUPCA } from '../../utils/validation'
import { BarcodeEncoder } from './base'

// UPC-A 与 EAN-13 共用编码表
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
 * UPC-A 编码器
 * 12 位数字（11 位数据 + 1 位校验）
 * 结构: 起始条(3) + 左侧6位(42) + 中间条(5) + 右侧6位(42) + 终止条(3) = 95 模块
 * UPC-A 等价于前导 0 的 EAN-13
 */
export class UPCAEncoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'upca'
  }

  getMaxLength(): number {
    return 12
  }

  validate(content: string): boolean {
    return isValidUPCA(content)
  }

  getModuleCount(_content: string): number {
    return 95
  }

  encodeToModules(content: string): number[] {
    const digits = this.prepareDigits(content)
    const leftDigits = digits.slice(0, 6)
    const rightDigits = digits.slice(6, 12)

    const bits: string[] = []

    // 起始条
    bits.push('101')

    // 左侧 6 位（L 编码）
    for (let i = 0; i < 6; i++) {
      bits.push(L_ENCODINGS[leftDigits[i]])
    }

    // 中间条
    bits.push('01010')

    // 右侧 6 位（R 编码）
    for (let i = 0; i < 6; i++) {
      bits.push(R_ENCODINGS[rightDigits[i]])
    }

    // 终止条
    bits.push('101')

    return this.bitsToModules(bits.join(''))
  }

  private prepareDigits(content: string): number[] {
    const digits = content.split('').map(Number)
    if (digits.length === 11) {
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
