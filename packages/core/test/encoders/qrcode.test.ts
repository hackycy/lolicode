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

    it('matches a standard QR matrix for fixed version, level, and mask', () => {
      const result = encoder.encode('LOLI', { version: 1, errorLevel: 'M', maskPattern: 0, margin: 0 })
      const expected = [
        '111111100101001111111',
        '100000101101001000001',
        '101110100110001011101',
        '101110100010001011101',
        '101110101100101011101',
        '100000100100101000001',
        '111111101010101111111',
        '000000000001100000000',
        '101010100011000010010',
        '110011000100001000000',
        '100101100100100011000',
        '010011010000001001110',
        '110111100100101010110',
        '000000001011010100001',
        '111111100101011100001',
        '100000100111110111011',
        '101110101011011100101',
        '101110100100001000110',
        '101110101100100010001',
        '100000100010001000111',
        '111111101100101010101',
      ]

      expect(result.data.map(row => row.join(''))).toEqual(expected)
    })

    it('throws when requested version cannot contain the data', () => {
      expect(() => encoder.encode('A'.repeat(40), { version: 1, errorLevel: 'H' })).toThrow('Data too long')
    })

    it('throws on invalid mask pattern', () => {
      expect(() => encoder.encode('TEST', { maskPattern: 8 })).toThrow('Invalid QR mask pattern')
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
