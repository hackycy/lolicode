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
    expect(result.metadata.family).toBe('matrix')
    expect(result.width).toBe(result.height)
    expect(result.data.length).toBe(result.height)
    for (const row of result.data) {
      expect(row.length).toBe(result.width)
    }
  })

  it('uses ECC200 finder borders', () => {
    const result = encoder.encode('A')
    expect(result.data[0].filter((_cell, index) => index % 2 === 0).every(cell => cell === 1)).toBe(true)
    expect(result.data[result.height - 1].every(cell => cell === 1)).toBe(true)
    expect(result.data.every(row => row[0] === 1)).toBe(true)
    expect(result.data.every((row, index) => row[result.width - 1] === (index % 2 === 0 ? 0 : 1))).toBe(true)
  })

  it('supports rectangular symbols', () => {
    const result = encoder.encode('HELLO', { shape: 'rectangle' })
    expect(result.width).toBeGreaterThan(result.height)
  })

  it('throws on unsupported mode option', () => {
    expect(() => encoder.encode('HELLO', { mode: 'base256' } as never)).toThrow('Unsupported Data Matrix mode')
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
