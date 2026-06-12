import { describe, expect, it } from 'vitest'
import { GS1_128Encoder } from '../../src/encoders/barcode/gs1_128'

function isValidBarcodeMatrix(result: { data: number[][], width: number, height: number }) {
  expect(result.data.length).toBe(result.height)
  for (const row of result.data) {
    expect(row.length).toBe(result.width)
    for (const cell of row) {
      expect(cell === 0 || cell === 1).toBe(true)
    }
  }
}

describe('gs1_128Encoder', () => {
  const encoder = new GS1_128Encoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('gs1_128')
  })

  it('validates numeric content', () => {
    expect(encoder.validate('00012345678905')).toBe(true)
    expect(encoder.validate('1234567890')).toBe(true)
  })

  it('validates AI bracket format', () => {
    expect(encoder.validate('(01)00012345678905')).toBe(true)
    expect(encoder.validate('(10)ABC123')).toBe(false) // non-digit
  })

  it('rejects empty content', () => {
    expect(encoder.validate('')).toBe(false)
  })

  it('rejects non-digit characters', () => {
    expect(encoder.validate('abc')).toBe(false)
    expect(encoder.validate('123a456')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('00012345678905')
    expect(result.metadata.type).toBe('gs1_128')
    isValidBarcodeMatrix(result)
  })

  it('encodes bracket format', () => {
    const result = encoder.encode('(01)00012345678905')
    expect(result.metadata.type).toBe('gs1_128')
    isValidBarcodeMatrix(result)
  })

  it('produces consistent output', () => {
    const a = encoder.encode('1234567890')
    const b = encoder.encode('1234567890')
    expect(a.data).toEqual(b.data)
  })

  it('different inputs produce different output', () => {
    const a = encoder.encode('1234567890')
    const b = encoder.encode('9876543210')
    expect(a.data).not.toEqual(b.data)
  })

  it('throws on invalid content', () => {
    expect(() => encoder.encode('')).toThrow()
  })
})
