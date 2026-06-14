import { describe, expect, it } from 'vitest'
import { Code39Encoder } from '../../src/encoders/barcode/code39'
import { Code128Encoder } from '../../src/encoders/barcode/code128'
import { EAN13Encoder } from '../../src/encoders/barcode/ean13'
import { ITFEncoder } from '../../src/encoders/barcode/itf'
import { code39, code128, ean13, itf } from '../../src/index'

function isValidBarcodeMatrix(result: { data: number[][], width: number, height: number }) {
  expect(result.data.length).toBe(result.height)
  for (const row of result.data) {
    expect(row.length).toBe(result.width)
    for (const cell of row) {
      expect(cell === 0 || cell === 1).toBe(true)
    }
  }
}

describe('code128Encoder', () => {
  const encoder = new Code128Encoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('code128')
  })

  it('validates ASCII content', () => {
    expect(encoder.validate('Hello World')).toBe(true)
    expect(encoder.validate('')).toBe(false)
  })

  it('rejects non-printable ASCII', () => {
    expect(encoder.validate(String.fromCharCode(0))).toBe(false)
    expect(encoder.validate(String.fromCharCode(31))).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('ABC123')
    expect(result.metadata.type).toBe('code128')
    expect(result.metadata.family).toBe('linear')
    expect(result.metadata.contentLength).toBe(6)
    isValidBarcodeMatrix(result)
  })

  it('encodes a logical one-dimensional symbol before matrix layout', () => {
    const symbol = encoder.encodeSymbol('ABC123')
    expect(symbol.width).toBe(encoder.getModuleCount('ABC123'))
    expect(symbol.modules).toHaveLength(symbol.width)
    expect(symbol.metadata.type).toBe('code128')
    expect(symbol.metadata.family).toBe('linear')
  })

  it('uses the complete 13-module stop symbol', () => {
    const runs = encoder.encodeToRuns('A')
    expect(runs.slice(-7)).toEqual([2, 3, 3, 1, 1, 1, 2])
    expect(runs.reduce((sum, run) => sum + run, 0)).toBe(46)
  })

  it('throws on unsupported subset option', () => {
    expect(() => encoder.encode('ABC123', { subset: 'C' } as never)).toThrow('Code 128 subset option is not supported')
  })

  it('uses independent barcode layout defaults', () => {
    const result = encoder.encode('ABC123')
    expect(result.height).toBe(26)
    expect(result.width).toBe((encoder.getModuleCount('ABC123') + 20) * 2)
  })

  it('lays out module width, quiet zone, height, and vertical margin independently', () => {
    const result = encoder.encode('ABC123', {
      height: 5,
      moduleWidth: 3,
      quietZone: 2,
      verticalMargin: 1,
    })

    expect(result.height).toBe(7)
    expect(result.width).toBe((encoder.getModuleCount('ABC123') + 4) * 3)
    expect(result.data[0].every(cell => cell === 0)).toBe(true)
    expect(result.data[1].slice(0, 6).every(cell => cell === 0)).toBe(true)
  })

  it('throws on unsupported showText option', () => {
    expect(() => encoder.encode('ABC123', { showText: true } as never)).toThrow('Barcode showText option is not supported')
  })

  it('produces consistent output', () => {
    const a = encoder.encode('TEST')
    const b = encoder.encode('TEST')
    expect(a.data).toEqual(b.data)
  })

  it('code128 convenience function works', () => {
    const result = code128('TEST')
    expect(result.metadata.type).toBe('code128')
  })
})

describe('code39Encoder', () => {
  const encoder = new Code39Encoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('code39')
  })

  it('validates uppercase content', () => {
    expect(encoder.validate('ABC 123')).toBe(true)
    expect(encoder.validate('')).toBe(false)
  })

  it('accepts lowercase (auto-uppercased)', () => {
    expect(encoder.validate('abc')).toBe(true)
  })

  it('rejects invalid chars', () => {
    expect(encoder.validate('abc@123')).toBe(false)
    expect(encoder.validate('ABC*123')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('TEST')
    expect(result.metadata.type).toBe('code39')
    isValidBarcodeMatrix(result)
  })

  it('code39 convenience function works', () => {
    const result = code39('TEST')
    expect(result.metadata.type).toBe('code39')
  })
})

describe('eAN13Encoder', () => {
  const encoder = new EAN13Encoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('ean13')
  })

  it('validates 12-13 digit strings', () => {
    expect(encoder.validate('400638133393')).toBe(true)
    expect(encoder.validate('4006381333931')).toBe(true)
    expect(encoder.validate('4006381333932')).toBe(false)
    expect(encoder.validate('12345')).toBe(false)
  })

  it('encodes 12-digit content with auto check digit', () => {
    const result = encoder.encode('400638133393', { moduleWidth: 1, quietZone: 0, verticalMargin: 0 })
    expect(result.metadata.type).toBe('ean13')
    expect(result.width).toBe(95)
    isValidBarcodeMatrix(result)
  })

  it('encodes 13-digit content', () => {
    const result = encoder.encode('4006381333931')
    expect(result.metadata.type).toBe('ean13')
    isValidBarcodeMatrix(result)
  })

  it('uses the EAN-13 default quiet zone', () => {
    const result = encoder.encode('400638133393')
    expect(result.width).toBe((encoder.getModuleCount('400638133393') + 22) * 2)
  })

  it('ean13 convenience function works', () => {
    const result = ean13('400638133393')
    expect(result.metadata.type).toBe('ean13')
  })

  it('throws on unsupported includeChecksum option', () => {
    expect(() => encoder.encode('400638133393', { includeChecksum: false } as never)).toThrow('EAN includeChecksum option is not supported')
  })
})

describe('iTFEncoder', () => {
  const encoder = new ITFEncoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('itf')
  })

  it('validates even-length digit strings', () => {
    expect(encoder.validate('1234')).toBe(true)
    expect(encoder.validate('123')).toBe(false)
    expect(encoder.validate('')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('1234567890')
    expect(result.metadata.type).toBe('itf')
    isValidBarcodeMatrix(result)
  })

  it('uses the ITF stop pattern with the same wide width as digit patterns', () => {
    expect(encoder.encodeToRuns('12').slice(-3)).toEqual([2, 1, 1])
  })

  it('itf convenience function works', () => {
    const result = itf('1234')
    expect(result.metadata.type).toBe('itf')
  })

  it('encodeToRuns also rejects odd-length content', () => {
    expect(() => encoder.encodeToRuns('123')).toThrow('Invalid content for itf')
  })

  it('throws on unsupported wideToNarrowRatio option', () => {
    expect(() => encoder.encode('1234', { wideToNarrowRatio: 3 } as never)).toThrow('ITF wideToNarrowRatio option is not supported')
  })
})
