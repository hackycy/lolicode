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

const PARITY_PATTERNS: Record<number, string[]> = {
  0: [
    'EEEOOO',
    'EEOEOO',
    'EEOOEO',
    'EEOOOE',
    'EOEEOO',
    'EOOEEO',
    'EOOOEE',
    'EOEOEO',
    'EOEOOE',
    'EOOEOE',
  ],
  1: [
    'OOOEEE',
    'OOEOEE',
    'OOEEOE',
    'OOEEEO',
    'OEOOEE',
    'OEEOOE',
    'OEEEOO',
    'OEOEOE',
    'OEOEEO',
    'OEEOEO',
  ],
}

interface PreparedUPCE {
  numberSystem: number
  dataDigits: number[]
  checkDigit: number
}

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

  protected getDefaultQuietZone(): number {
    return 9
  }

  validate(content: string): boolean {
    if (!/^\d{6,8}$/.test(content))
      return false
    try {
      this.prepareDigits(content)
      return true
    }
    catch {
      return false
    }
  }

  encodeToRuns(content: string): number[] {
    const prepared = this.prepareDigits(content)

    // UPC-E 校验位不直接编码在数字中，而是由奇偶模式承载。
    const encodingPattern = this.getEncodingPattern(prepared.numberSystem, prepared.checkDigit)
    const dataDigits = prepared.dataDigits

    const bits: string[] = []

    // 起始条
    bits.push('101')

    // 6 位数据
    for (let i = 0; i < 6; i++) {
      const digit = dataDigits[i]
      if (encodingPattern[i] === 'O') {
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

  private prepareDigits(content: string): PreparedUPCE {
    const digits = content.split('').map(Number)
    let numberSystem = 0
    let dataDigits: number[]
    let checkDigit: number | undefined

    if (digits.length === 6) {
      dataDigits = digits
    }
    else if (digits.length === 7) {
      dataDigits = digits.slice(0, 6)
      checkDigit = digits[6]
    }
    else {
      numberSystem = digits[0]
      dataDigits = digits.slice(1, 7)
      checkDigit = digits[7]
    }

    if (numberSystem !== 0 && numberSystem !== 1)
      throw new Error(`Invalid UPC-E number system: ${numberSystem}`)

    const upcaDigits = this.expandToUPCA(numberSystem, dataDigits)
    const expectedCheckDigit = calculateEANCheckDigit(upcaDigits)
    if (checkDigit !== undefined && checkDigit !== expectedCheckDigit)
      throw new Error(`Invalid UPC-E check digit: ${checkDigit}`)

    return {
      numberSystem,
      dataDigits,
      checkDigit: expectedCheckDigit,
    }
  }

  private expandToUPCA(numberSystem: number, digits: number[]): number[] {
    const lastDigit = digits[5]

    switch (lastDigit) {
      case 0:
      case 1:
      case 2:
        return `${numberSystem}${digits[0]}${digits[1]}${lastDigit}0000${digits[2]}${digits[3]}${digits[4]}`.split('').map(Number)
      case 3:
        return `${numberSystem}${digits[0]}${digits[1]}${digits[2]}00000${digits[3]}${digits[4]}`.split('').map(Number)
      case 4:
        return `${numberSystem}${digits[0]}${digits[1]}${digits[2]}${digits[3]}00000${digits[4]}`.split('').map(Number)
      default:
        return `${numberSystem}${digits[0]}${digits[1]}${digits[2]}${digits[3]}${digits[4]}0000${lastDigit}`.split('').map(Number)
    }
  }

  private getEncodingPattern(numberSystem: number, checkDigit: number): string {
    return PARITY_PATTERNS[numberSystem][checkDigit]
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
