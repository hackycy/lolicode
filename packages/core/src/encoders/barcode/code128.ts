import type { Code128Options, CodeType, DotMatrix } from '../../types'
import { BarcodeEncoder } from './base'

// Code 128 编码表：每个符号的条空模式（6个元素：3条+3空）
// 值为模块宽度
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2], // 0
  [2, 2, 2, 1, 2, 2], // 1
  [2, 2, 2, 2, 2, 1], // 2
  [1, 2, 1, 2, 2, 3], // 3
  [1, 2, 1, 3, 2, 2], // 4
  [1, 3, 1, 2, 2, 2], // 5
  [1, 2, 2, 2, 1, 3], // 6
  [1, 2, 2, 3, 1, 2], // 7
  [1, 3, 2, 2, 1, 2], // 8
  [2, 2, 1, 2, 1, 3], // 9
  [2, 2, 1, 3, 1, 2], // 10
  [2, 3, 1, 2, 1, 2], // 11
  [1, 1, 2, 2, 3, 2], // 12
  [1, 2, 2, 1, 3, 2], // 13
  [1, 2, 2, 2, 3, 1], // 14
  [1, 1, 3, 2, 2, 2], // 15
  [1, 2, 3, 1, 2, 2], // 16
  [1, 2, 3, 2, 2, 1], // 17
  [2, 2, 3, 2, 1, 1], // 18
  [2, 2, 1, 1, 3, 2], // 19
  [2, 2, 1, 2, 3, 1], // 20
  [2, 1, 3, 2, 1, 2], // 21
  [2, 2, 3, 1, 1, 2], // 22
  [3, 1, 2, 1, 3, 1], // 23
  [3, 1, 1, 2, 2, 2], // 24
  [3, 2, 1, 1, 2, 2], // 25
  [3, 2, 1, 2, 2, 1], // 26
  [3, 1, 2, 2, 1, 2], // 27
  [3, 2, 2, 1, 1, 2], // 28
  [3, 2, 2, 2, 1, 1], // 29
  [2, 1, 2, 1, 2, 3], // 30
  [2, 1, 2, 3, 2, 1], // 31
  [2, 3, 2, 1, 2, 1], // 32
  [1, 1, 1, 3, 2, 3], // 33
  [1, 3, 1, 1, 2, 3], // 34
  [1, 3, 1, 3, 2, 1], // 35
  [1, 1, 2, 3, 1, 3], // 36
  [1, 3, 2, 1, 1, 3], // 37
  [1, 3, 2, 3, 1, 1], // 38
  [2, 1, 1, 3, 1, 3], // 39
  [2, 3, 1, 1, 1, 3], // 40
  [2, 3, 1, 3, 1, 1], // 41
  [1, 1, 2, 1, 3, 3], // 42
  [1, 1, 2, 3, 3, 1], // 43
  [1, 3, 2, 1, 3, 1], // 44
  [1, 1, 3, 1, 2, 3], // 45
  [1, 1, 3, 3, 2, 1], // 46
  [1, 3, 3, 1, 2, 1], // 47
  [3, 1, 3, 1, 2, 1], // 48
  [2, 1, 1, 3, 3, 1], // 49
  [2, 3, 1, 1, 3, 1], // 50
  [2, 1, 3, 1, 1, 3], // 51
  [2, 1, 3, 3, 1, 1], // 52
  [2, 1, 3, 1, 3, 1], // 53
  [3, 1, 1, 1, 2, 3], // 54
  [3, 1, 1, 3, 2, 1], // 55
  [3, 3, 1, 1, 2, 1], // 56
  [3, 1, 2, 1, 1, 3], // 57
  [3, 1, 2, 3, 1, 1], // 58
  [3, 3, 2, 1, 1, 1], // 59
  [3, 1, 4, 1, 1, 1], // 60
  [2, 2, 1, 4, 1, 1], // 61
  [4, 3, 1, 1, 1, 1], // 62
  [1, 1, 1, 2, 2, 4], // 63
  [1, 1, 1, 4, 2, 2], // 64
  [1, 2, 1, 1, 2, 4], // 65
  [1, 2, 1, 4, 2, 1], // 66
  [1, 4, 1, 1, 2, 2], // 67
  [1, 4, 1, 2, 2, 1], // 68
  [1, 1, 2, 2, 1, 4], // 69
  [1, 1, 2, 4, 1, 2], // 70
  [1, 2, 2, 1, 1, 4], // 71
  [1, 2, 2, 4, 1, 1], // 72
  [1, 4, 2, 1, 1, 2], // 73
  [1, 4, 2, 2, 1, 1], // 74
  [2, 4, 1, 2, 1, 1], // 75
  [2, 2, 1, 1, 1, 4], // 76
  [4, 1, 3, 1, 1, 1], // 77
  [2, 4, 1, 1, 1, 2], // 78
  [1, 3, 4, 1, 1, 1], // 79
  [1, 1, 1, 2, 4, 2], // 80
  [1, 2, 1, 1, 4, 2], // 81
  [1, 2, 1, 2, 4, 1], // 82
  [1, 1, 4, 2, 1, 2], // 83
  [1, 2, 4, 1, 1, 2], // 84
  [1, 2, 4, 2, 1, 1], // 85
  [4, 1, 1, 2, 1, 2], // 86
  [4, 2, 1, 1, 1, 2], // 87
  [4, 2, 1, 2, 1, 1], // 88
  [2, 1, 2, 1, 4, 1], // 89
  [2, 1, 4, 1, 2, 1], // 90
  [4, 1, 2, 1, 2, 1], // 91
  [1, 1, 1, 1, 4, 3], // 92
  [1, 1, 1, 3, 4, 1], // 93
  [1, 3, 1, 1, 4, 1], // 94
  [1, 1, 4, 1, 1, 3], // 95
  [1, 1, 4, 3, 1, 1], // 96
  [4, 1, 1, 1, 1, 3], // 97
  [4, 1, 1, 3, 1, 1], // 98
  [1, 1, 3, 1, 4, 1], // 99
  [1, 1, 4, 1, 3, 1], // 100
  [3, 1, 1, 1, 4, 1], // 101
  [4, 1, 1, 1, 3, 1], // 102
  [2, 1, 1, 4, 1, 2], // 103 (START A)
  [2, 1, 1, 2, 1, 4], // 104 (START B)
  [2, 1, 1, 2, 3, 2], // 105 (START C)
  [2, 3, 3, 1, 1, 1, 2], // 106 (STOP)
]

// Code 128 起始码与控制码（码字值）
const START_A = 103
const START_B = 104
const START_C = 105
const CODE_C = 99 // 在 A/B 子集中切换到 C
const CODE_B = 100 // 在 A/C 子集中切换到 B
const STOP_CODE = 106

/**
 * Code 128 编码器
 *
 * 支持子集 A/B/C 及自动选择（auto）。auto 模式下对连续数字使用 Code C
 * 进行成对压缩，其余字符使用 Code B。
 */
export class Code128Encoder extends BarcodeEncoder {
  private subset: 'A' | 'B' | 'C' | 'auto' = 'auto'

  getType(): CodeType {
    return 'code128'
  }

  getMaxLength(): number {
    return 80
  }

  validate(content: string): boolean {
    if (content.length === 0 || content.length > this.getMaxLength())
      return false
    // 支持可打印 ASCII 32-127
    for (let i = 0; i < content.length; i++) {
      const code = content.charCodeAt(i)
      if (code < 32 || code > 127)
        return false
    }
    return true
  }

  encode(content: string, options?: Code128Options): DotMatrix {
    this.subset = options?.subset ?? 'auto'
    return super.encode(content, options)
  }

  encodeToRuns(content: string): number[] {
    const codes = this.encodeContent(content)
    const checksum = this.calculateChecksum(codes)
    const allCodes = [...codes, checksum, STOP_CODE]

    const modules: number[] = []
    for (const code of allCodes) {
      const pattern = CODE128_PATTERNS[code]
      for (let i = 0; i < pattern.length; i++) {
        modules.push(pattern[i])
      }
    }
    return modules
  }

  private encodeContent(content: string): number[] {
    switch (this.subset) {
      case 'A':
        return this.encodeFixedAB(content, 'A')
      case 'B':
        return this.encodeFixedAB(content, 'B')
      case 'C':
        return this.encodeFixedC(content)
      default:
        return this.encodeAuto(content)
    }
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9'
  }

  private digitsFrom(content: string, idx: number): number {
    let n = 0
    while (idx + n < content.length && this.isDigit(content[idx + n]))
      n++
    return n
  }

  private encodeValueAB(code: number, set: 'A' | 'B'): number {
    if (set === 'B') {
      if (code < 32 || code > 127)
        throw new Error(`Character code ${code} not encodable in Code 128B`)
      return code - 32
    }
    // Code A: 32-95 -> 0-63, 0-31 (控制字符) -> 64-95
    if (code >= 32 && code <= 95)
      return code - 32
    if (code >= 0 && code <= 31)
      return code + 64
    throw new Error(`Character code ${code} not encodable in Code 128A`)
  }

  private encodeFixedAB(content: string, set: 'A' | 'B'): number[] {
    const codes: number[] = [set === 'A' ? START_A : START_B]
    for (let i = 0; i < content.length; i++) {
      codes.push(this.encodeValueAB(content.charCodeAt(i), set))
    }
    return codes
  }

  private encodeFixedC(content: string): number[] {
    if (content.length % 2 !== 0)
      throw new Error('Code 128C requires an even number of digits')
    const codes: number[] = [START_C]
    for (let i = 0; i < content.length; i += 2) {
      if (!this.isDigit(content[i]) || !this.isDigit(content[i + 1]))
        throw new Error('Code 128C only encodes digits')
      codes.push(Number.parseInt(content.substring(i, i + 2), 10))
    }
    return codes
  }

  private encodeAuto(content: string): number[] {
    const codes: number[] = []
    let i = 0
    let mode: 'B' | 'C'

    const initialDigits = this.digitsFrom(content, 0)
    if (initialDigits >= 2 && (initialDigits >= 4 || initialDigits === content.length)) {
      mode = 'C'
      codes.push(START_C)
    }
    else {
      mode = 'B'
      codes.push(START_B)
    }

    while (i < content.length) {
      if (mode === 'C') {
        if (this.digitsFrom(content, i) >= 2) {
          codes.push(Number.parseInt(content.substring(i, i + 2), 10))
          i += 2
        }
        else {
          codes.push(CODE_B)
          mode = 'B'
        }
      }
      else {
        if (this.digitsFrom(content, i) >= 4) {
          codes.push(CODE_C)
          mode = 'C'
        }
        else {
          codes.push(this.encodeValueAB(content.charCodeAt(i), 'B'))
          i++
        }
      }
    }
    return codes
  }

  private calculateChecksum(codes: number[]): number {
    let sum = codes[0]
    for (let i = 1; i < codes.length; i++) {
      sum += codes[i] * i
    }
    return sum % 103
  }
}
