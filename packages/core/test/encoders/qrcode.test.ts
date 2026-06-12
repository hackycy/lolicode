import { describe, expect, it } from 'vitest'
import { QREncoder } from '../../src/encoders/qrcode'
import { qr } from '../../src/index'

const encoder = new QREncoder()

describe('qREncoder', () => {
  describe('validate', () => {
    it('accepts non-empty content', () => {
      expect(encoder.validate('HELLO')).toBe(true)
    })

    it('rejects empty content', () => {
      expect(encoder.validate('')).toBe(false)
    })
  })

  describe('getType', () => {
    it('returns qrcode', () => {
      expect(encoder.getType()).toBe('qrcode')
    })
  })

  describe('getMaxLength', () => {
    it('returns 2953', () => {
      expect(encoder.getMaxLength()).toBe(2953)
    })
  })

  describe('encode', () => {
    it('produces a square matrix', () => {
      const result = encoder.encode('HELLO')
      expect(result.width).toBe(result.height)
      expect(result.data.length).toBe(result.height)
      expect(result.data[0].length).toBe(result.width)
    })

    it('encodes numeric content', () => {
      const result = encoder.encode('0123456789')
      expect(result.metadata.type).toBe('qrcode')
      expect(result.metadata.version).toBeGreaterThanOrEqual(1)
      expect(result.metadata.version).toBeLessThanOrEqual(40)
    })

    it('encodes alphanumeric content', () => {
      const result = encoder.encode('HELLO WORLD')
      expect(result.metadata.type).toBe('qrcode')
    })

    it('encodes byte content', () => {
      const result = encoder.encode('hello world')
      expect(result.metadata.type).toBe('qrcode')
    })

    it('respects error level option', () => {
      const result = encoder.encode('TEST', { errorLevel: 'H' })
      expect(result.metadata.errorLevel).toBe('H')
    })

    it('respects version option', () => {
      const result = encoder.encode('TEST', { version: 5 })
      expect(result.metadata.version).toBe(5)
    })

    it('adds margin', () => {
      const noMargin = encoder.encode('TEST', { margin: 0 })
      const withMargin = encoder.encode('TEST', { margin: 4 })
      expect(withMargin.width).toBeGreaterThan(noMargin.width)
    })

    it('throws on invalid content', () => {
      expect(() => encoder.encode('')).toThrow()
    })

    it('produces consistent output for same input', () => {
      const a = encoder.encode('TEST', { version: 1, errorLevel: 'M', maskPattern: 0 })
      const b = encoder.encode('TEST', { version: 1, errorLevel: 'M', maskPattern: 0 })
      expect(a.data).toEqual(b.data)
    })
  })

  describe('qr() convenience function', () => {
    it('works the same as encoder', () => {
      const result = qr('HELLO')
      expect(result.metadata.type).toBe('qrcode')
      expect(result.width).toBe(result.height)
    })
  })
})
