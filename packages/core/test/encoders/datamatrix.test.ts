import { describe, expect, it } from 'vitest'
import { DataMatrixEncoder } from '../../src/encoders/datamatrix'
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
})
