import { describe, expect, it } from 'vitest'
import { DataMatrixEncoder } from '../../src/encoders/datamatrix'
import { calculateECC200 } from '../../src/encoders/datamatrix/reed-solomon'
import { dataMatrix } from '../../src/index'

const encoder = new DataMatrixEncoder()

describe('dataMatrixEncoder', () => {
  it('returns correct type', () => {
    expect(encoder.getType()).toBe('datamatrix')
  })

  it('validates non-empty content', () => {
    expect(encoder.validate('ABC')).toBe(true)
    expect(encoder.validate('')).toBe(false)
  })

  it('encodes to square matrix by default', () => {
    const result = encoder.encode('HELLO')
    expect(result.metadata.type).toBe('datamatrix')
    expect(result.metadata.family).toBe('matrix')
    expect(result.width).toBe(result.height)
    expect(result.data.length).toBe(result.height)
    for (const row of result.data) {
      expect(row.length).toBe(result.width)
    }
  })

  it('produces consistent output', () => {
    const a = encoder.encode('TEST')
    const b = encoder.encode('TEST')
    expect(a.data).toEqual(b.data)
  })

  it('dataMatrix convenience function works', () => {
    const result = dataMatrix('TEST')
    expect(result.metadata.type).toBe('datamatrix')
  })

  it('throws on empty content', () => {
    expect(() => encoder.encode('')).toThrow()
  })

  it('selects the smallest fitting square symbol', () => {
    // 'A' -> 1 ASCII codeword <= 3 (10x10 capacity); margin 0 to inspect raw symbol
    expect(encoder.encode('A', { margin: 0 }).width).toBe(10)
    // longer content escalates symbol size
    const big = encoder.encode('HELLO WORLD DATA MATRIX TEST 12345', { margin: 0 })
    expect(big.width).toBe(big.height)
    expect(big.width).toBeGreaterThan(10)
  })

  it('produces standard ECC200 finder pattern (solid left/bottom border)', () => {
    const size = 10
    const m = encoder.encode('A', { margin: 0 }) // raw 10x10 symbol
    // left column fully solid
    for (let r = 0; r < size; r++) {
      expect(m.data[r][0]).toBe(1)
    }
    // bottom row fully solid
    for (let c = 0; c < size; c++) {
      expect(m.data[size - 1][c]).toBe(1)
    }
    // top timing row alternates starting with dark
    expect(m.data[0][0]).toBe(1)
    expect(m.data[0][1]).toBe(0)
  })

  it('encodes rectangular symbols', () => {
    const m = encoder.encode('ABC', { shape: 'rectangle' })
    expect(m.height).not.toBe(m.width)
  })

  it('calculateECC200 matches known ISO/IEC 16022 vector for "123456"', () => {
    // "123456" -> digit pairs 12,34,56 -> codewords 142,164,186 (pair value + 130)
    // 10x10 symbol has 5 EC codewords. Reference EC: [114,25,5,88,102]
    expect(calculateECC200([142, 164, 186], 5)).toEqual([114, 25, 5, 88, 102])
  })
})
