import { describe, expect, it } from 'vitest'
import { PDF417Encoder } from '../../src/encoders/pdf417'
import { pdf417 } from '../../src/index'

const encoder = new PDF417Encoder()

describe('pDF417Encoder', () => {
  it('returns correct type', () => {
    expect(encoder.getType()).toBe('pdf417')
  })

  it('validates non-empty content', () => {
    expect(encoder.validate('ABC')).toBe(true)
    expect(encoder.validate('')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('HELLO')
    expect(result.metadata.type).toBe('pdf417')
    expect(result.height).toBeGreaterThanOrEqual(3)
    expect(result.data.length).toBe(result.height)
    for (const row of result.data) {
      expect(row.length).toBe(result.width)

      for (const cell of row) {
        expect(cell === 0 || cell === 1).toBe(true)
      }
    }
  })

  it('produces consistent output', () => {
    const a = encoder.encode('TEST')
    const b = encoder.encode('TEST')
    expect(a.data).toEqual(b.data)
  })

  it('pdf417 convenience function works', () => {
    const result = pdf417('TEST')
    expect(result.metadata.type).toBe('pdf417')
  })

  it('throws on empty content', () => {
    expect(() => encoder.encode('')).toThrow()
  })
})
