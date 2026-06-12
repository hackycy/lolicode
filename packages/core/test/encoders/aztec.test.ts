import { describe, expect, it } from 'vitest'
import { AztecEncoder } from '../../src/encoders/aztec'

function isValidMatrix(result: { data: number[][], width: number, height: number }) {
  expect(result.data.length).toBe(result.height)
  for (const row of result.data) {
    expect(row.length).toBe(result.width)
    for (const cell of row) {
      expect(cell === 0 || cell === 1).toBe(true)
    }
  }
}

describe('aztecEncoder', () => {
  const encoder = new AztecEncoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('aztec')
  })

  it('validates alphanumeric content', () => {
    expect(encoder.validate('HELLO')).toBe(true)
    expect(encoder.validate('hello')).toBe(true)
    expect(encoder.validate('12345')).toBe(true)
    expect(encoder.validate('Hello World')).toBe(true)
  })

  it('rejects empty content', () => {
    expect(encoder.validate('')).toBe(false)
  })

  it('rejects unsupported characters', () => {
    expect(encoder.validate('hello!')).toBe(false)
    expect(encoder.validate('test@123')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('HELLO')
    expect(result.metadata.type).toBe('aztec')
    isValidMatrix(result)
  })

  it('has bulls-eye finder pattern at center', () => {
    const result = encoder.encode('A')
    const cx = Math.floor(result.width / 2)
    const cy = Math.floor(result.height / 2)
    // Center should be black (1)
    expect(result.data[cy][cx]).toBe(1)
  })

  it('produces consistent output', () => {
    const a = encoder.encode('TEST')
    const b = encoder.encode('TEST')
    expect(a.data).toEqual(b.data)
  })

  it('different inputs produce different output', () => {
    const a = encoder.encode('ABC')
    const b = encoder.encode('XYZ')
    expect(a.data).not.toEqual(b.data)
  })

  it('supports margin option', () => {
    const a = encoder.encode('TEST', { margin: 0 })
    const b = encoder.encode('TEST', { margin: 4 })
    expect(b.width).toBe(a.width + 8)
    expect(b.height).toBe(a.height + 8)
  })

  it('throws on invalid content', () => {
    expect(() => encoder.encode('')).toThrow()
  })

  it('throws on content too long', () => {
    const longContent = 'A'.repeat(51)
    expect(() => encoder.encode(longContent)).toThrow()
  })
})
