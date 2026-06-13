import type { CodeType } from '../../types'
import { BarcodeEncoder } from './base'

// Code 128 编码表（与 Code 128 共用）
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2],
  [2, 2, 2, 1, 2, 2],
  [2, 2, 2, 2, 2, 1],
  [1, 2, 1, 2, 2, 3],
  [1, 2, 1, 3, 2, 2],
  [1, 3, 1, 2, 2, 2],
  [1, 2, 2, 2, 1, 3],
  [1, 2, 2, 3, 1, 2],
  [1, 3, 2, 2, 1, 2],
  [2, 2, 1, 2, 1, 3],
  [2, 2, 1, 3, 1, 2],
  [2, 3, 1, 2, 1, 2],
  [1, 1, 2, 2, 3, 2],
  [1, 2, 2, 1, 3, 2],
  [1, 2, 2, 2, 3, 1],
  [1, 1, 3, 2, 2, 2],
  [1, 2, 3, 1, 2, 2],
  [1, 2, 3, 2, 2, 1],
  [2, 2, 3, 2, 1, 1],
  [2, 2, 1, 1, 3, 2],
  [2, 2, 1, 2, 3, 1],
  [2, 1, 3, 2, 1, 2],
  [2, 2, 3, 1, 1, 2],
  [3, 1, 2, 1, 3, 1],
  [3, 1, 1, 2, 2, 2],
  [3, 2, 1, 1, 2, 2],
  [3, 2, 1, 2, 2, 1],
  [3, 1, 2, 2, 1, 2],
  [3, 2, 2, 1, 1, 2],
  [3, 2, 2, 2, 1, 1],
  [2, 1, 2, 1, 2, 3],
  [2, 1, 2, 3, 2, 1],
  [2, 3, 2, 1, 2, 1],
  [1, 1, 1, 3, 2, 3],
  [1, 3, 1, 1, 2, 3],
  [1, 3, 1, 3, 2, 1],
  [1, 1, 2, 3, 1, 3],
  [1, 3, 2, 1, 1, 3],
  [1, 3, 2, 3, 1, 1],
  [2, 1, 1, 3, 1, 3],
  [2, 3, 1, 1, 1, 3],
  [2, 3, 1, 3, 1, 1],
  [1, 1, 2, 1, 3, 3],
  [1, 1, 2, 3, 3, 1],
  [1, 3, 2, 1, 3, 1],
  [1, 1, 3, 1, 2, 3],
  [1, 1, 3, 3, 2, 1],
  [1, 3, 3, 1, 2, 1],
  [3, 1, 3, 1, 2, 1],
  [2, 1, 1, 3, 3, 1],
  [2, 3, 1, 1, 3, 1],
  [2, 1, 3, 1, 1, 3],
  [2, 1, 3, 3, 1, 1],
  [2, 1, 3, 1, 3, 1],
  [3, 1, 1, 1, 2, 3],
  [3, 1, 1, 3, 2, 1],
  [3, 3, 1, 1, 2, 1],
  [3, 1, 2, 1, 1, 3],
  [3, 1, 2, 3, 1, 1],
  [3, 3, 2, 1, 1, 1],
  [3, 1, 4, 1, 1, 1],
  [2, 2, 1, 4, 1, 1],
  [4, 3, 1, 1, 1, 1],
  [1, 1, 1, 2, 2, 4],
  [1, 1, 1, 4, 2, 2],
  [1, 2, 1, 1, 2, 4],
  [1, 2, 1, 4, 2, 1],
  [1, 4, 1, 1, 2, 2],
  [1, 4, 1, 2, 2, 1],
  [1, 1, 2, 2, 1, 4],
  [1, 1, 2, 4, 1, 2],
  [1, 2, 2, 1, 1, 4],
  [1, 2, 2, 4, 1, 1],
  [1, 4, 2, 1, 1, 2],
  [1, 4, 2, 2, 1, 1],
  [2, 4, 1, 2, 1, 1],
  [2, 2, 1, 1, 1, 4],
  [4, 1, 3, 1, 1, 1],
  [2, 4, 1, 1, 1, 2],
  [1, 3, 4, 1, 1, 1],
  [1, 1, 1, 2, 4, 2],
  [1, 2, 1, 1, 4, 2],
  [1, 2, 1, 2, 4, 1],
  [1, 1, 4, 2, 1, 2],
  [1, 2, 4, 1, 1, 2],
  [1, 2, 4, 2, 1, 1],
  [4, 1, 1, 2, 1, 2],
  [4, 2, 1, 1, 1, 2],
  [4, 2, 1, 2, 1, 1],
  [2, 1, 2, 1, 4, 1],
  [2, 1, 4, 1, 2, 1],
  [4, 1, 2, 1, 2, 1],
  [1, 1, 1, 1, 4, 3],
  [1, 1, 1, 3, 4, 1],
  [1, 3, 1, 1, 4, 1],
  [1, 1, 4, 1, 1, 3],
  [1, 1, 4, 3, 1, 1],
  [4, 1, 1, 1, 1, 3],
  [4, 1, 1, 3, 1, 1],
  [1, 1, 3, 1, 4, 1],
  [1, 1, 4, 1, 3, 1],
  [3, 1, 1, 1, 4, 1],
  [4, 1, 1, 1, 3, 1], // 102 FNC1
  [2, 1, 1, 4, 1, 2], // 103 START A
  [2, 1, 1, 2, 1, 4], // 104 START B
  [2, 1, 1, 2, 3, 2], // 105 START C
  [2, 3, 3, 1, 1, 1, 2], // 106 STOP
]

const CODE_B_START = 104
const CODE_C_START = 105
const CODE_B_SWITCH = 100
const CODE_C_SWITCH = 99
const FNC1 = 102
const STOP_CODE = 106
const FNC1_TOKEN = '\x1D'

interface AIDefinition {
  length: number
  variable?: boolean
  charset: 'numeric' | 'ascii'
}

interface GS1Element {
  ai: string
  value: string
  definition: AIDefinition
}

const AI_DEFINITIONS: Record<string, AIDefinition> = {
  '00': { length: 18, charset: 'numeric' },
  '01': { length: 14, charset: 'numeric' },
  '02': { length: 14, charset: 'numeric' },
  '10': { length: 20, variable: true, charset: 'ascii' },
  '11': { length: 6, charset: 'numeric' },
  '12': { length: 6, charset: 'numeric' },
  '13': { length: 6, charset: 'numeric' },
  '15': { length: 6, charset: 'numeric' },
  '16': { length: 6, charset: 'numeric' },
  '17': { length: 6, charset: 'numeric' },
  '20': { length: 2, charset: 'numeric' },
  '21': { length: 20, variable: true, charset: 'ascii' },
  '30': { length: 8, variable: true, charset: 'numeric' },
  '37': { length: 8, variable: true, charset: 'numeric' },
  '240': { length: 30, variable: true, charset: 'ascii' },
  '241': { length: 30, variable: true, charset: 'ascii' },
  '250': { length: 30, variable: true, charset: 'ascii' },
  '251': { length: 30, variable: true, charset: 'ascii' },
}

/**
 * GS1-128 编码器
 * 基于 Code 128，用于供应链标识（如 GTIN、批次号、有效期等）
 * 结构: START + FNC1 + 数据 + CHECKSUM + STOP
 * 支持 Application Identifier (AI) 编码
 */
export class GS1_128Encoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'gs1_128'
  }

  getMaxLength(): number {
    return 80
  }

  validate(content: string): boolean {
    if (content.length === 0 || content.length > this.getMaxLength())
      return false
    try {
      return this.parseElements(content).length > 0
    }
    catch {
      return false
    }
  }

  encodeToRuns(content: string): number[] {
    const tokens = this.buildDataTokens(this.parseElements(content))
    const startCode = this.chooseStartCode(tokens)
    const allCodes = [startCode, FNC1, ...this.encodeTokens(tokens, startCode)]

    const checksum = this.calculateChecksum(allCodes)
    allCodes.push(checksum, STOP_CODE)

    const modules: number[] = []
    for (const code of allCodes) {
      const pattern = CODE128_PATTERNS[code]
      for (let i = 0; i < pattern.length; i++) {
        modules.push(pattern[i])
      }
    }

    return modules
  }

  private parseElements(content: string): GS1Element[] {
    if (content.includes('(') || content.includes(')'))
      return this.parseBracketedElements(content)
    return this.parsePlainElements(content)
  }

  private parseBracketedElements(content: string): GS1Element[] {
    const elements: GS1Element[] = []
    let index = 0

    while (index < content.length) {
      if (content[index] !== '(')
        throw new Error(`Invalid GS1-128 AI at position ${index}`)

      const end = content.indexOf(')', index + 1)
      if (end === -1)
        throw new Error('Unclosed GS1-128 AI')

      const ai = content.slice(index + 1, end)
      const definition = this.getAIDefinition(ai)
      if (!definition)
        throw new Error(`Unsupported GS1-128 AI: ${ai}`)

      index = end + 1
      const nextAI = content.indexOf('(', index)
      const valueEnd = nextAI === -1 ? content.length : nextAI
      const value = content.slice(index, valueEnd)
      this.validateElement(ai, value, definition)
      elements.push({ ai, value, definition })
      index = valueEnd
    }

    return elements
  }

  private parsePlainElements(content: string): GS1Element[] {
    const elements: GS1Element[] = []
    let index = 0

    while (index < content.length) {
      const match = this.findAIDefinition(content, index)
      if (!match)
        throw new Error(`Unsupported GS1-128 AI at position ${index}`)

      const { ai, definition } = match
      index += ai.length
      const remaining = content.length - index
      const valueLength = definition.variable ? remaining : definition.length
      if (remaining < valueLength)
        throw new Error(`Invalid GS1-128 AI ${ai} length`)

      const value = content.slice(index, index + valueLength)
      this.validateElement(ai, value, definition)
      elements.push({ ai, value, definition })
      index += valueLength

      if (definition.variable && index < content.length)
        throw new Error(`Variable-length GS1-128 AI ${ai} must be bracketed unless it is last`)
    }

    return elements
  }

  private findAIDefinition(content: string, index: number): { ai: string, definition: AIDefinition } | undefined {
    for (const length of [4, 3, 2]) {
      const ai = content.slice(index, index + length)
      const definition = this.getAIDefinition(ai)
      if (definition)
        return { ai, definition }
    }
  }

  private getAIDefinition(ai: string): AIDefinition | undefined {
    if (!/^\d{2,4}$/.test(ai))
      return undefined
    if (AI_DEFINITIONS[ai])
      return AI_DEFINITIONS[ai]
    if (/^310\d$/.test(ai))
      return { length: 6, charset: 'numeric' }
    return undefined
  }

  private validateElement(ai: string, value: string, definition: AIDefinition): void {
    if (value.length === 0)
      throw new Error(`Missing GS1-128 AI ${ai} value`)
    if (definition.variable) {
      if (value.length > definition.length)
        throw new Error(`GS1-128 AI ${ai} value is too long`)
    }
    else if (value.length !== definition.length) {
      throw new Error(`GS1-128 AI ${ai} requires ${definition.length} characters`)
    }

    if (definition.charset === 'numeric' && !/^\d+$/.test(value))
      throw new Error(`GS1-128 AI ${ai} requires numeric data`)
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      if (code < 32 || code > 127)
        throw new Error(`Invalid GS1-128 character: ${value[i]}`)
    }
  }

  private buildDataTokens(elements: GS1Element[]): string[] {
    const tokens: string[] = []
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      for (const ch of `${element.ai}${element.value}`)
        tokens.push(ch)
      if (element.definition.variable && i < elements.length - 1)
        tokens.push(FNC1_TOKEN)
    }
    return tokens
  }

  private chooseStartCode(tokens: string[]): number {
    return this.isDigit(tokens[0]) && this.isDigit(tokens[1]) ? CODE_C_START : CODE_B_START
  }

  private encodeTokens(tokens: string[], startCode: number): number[] {
    const codes: number[] = []
    let codeSet: 'B' | 'C' = startCode === CODE_C_START ? 'C' : 'B'
    let i = 0

    while (i < tokens.length) {
      if (tokens[i] === FNC1_TOKEN) {
        codes.push(FNC1)
        i++
        continue
      }

      if (codeSet === 'C') {
        if (this.isDigit(tokens[i]) && this.isDigit(tokens[i + 1])) {
          codes.push(Number.parseInt(`${tokens[i]}${tokens[i + 1]}`, 10))
          i += 2
          continue
        }

        codes.push(CODE_B_SWITCH)
        codeSet = 'B'
        continue
      }

      const digitRunLength = this.getDigitRunLength(tokens, i)
      if (digitRunLength >= 4) {
        if (digitRunLength % 2 === 1) {
          codes.push(tokens[i].charCodeAt(0) - 32)
          i++
        }
        codes.push(CODE_C_SWITCH)
        codeSet = 'C'
        continue
      }

      codes.push(tokens[i].charCodeAt(0) - 32)
      i++
    }

    return codes
  }

  private getDigitRunLength(tokens: string[], index: number): number {
    let length = 0
    while (this.isDigit(tokens[index + length]))
      length++
    return length
  }

  private isDigit(token: string | undefined): boolean {
    return token !== undefined && token >= '0' && token <= '9'
  }

  private calculateChecksum(codes: number[]): number {
    let sum = codes[0]
    for (let i = 1; i < codes.length; i++) {
      sum += codes[i] * i
    }
    return sum % 103
  }
}
