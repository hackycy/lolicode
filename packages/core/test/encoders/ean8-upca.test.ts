import { describe, expect, it } from 'vitest'
import { EAN8Encoder } from '../../src/encoders/barcode/ean8'
import { UPCAEncoder } from '../../src/encoders/barcode/upca'
import { ean8, upca } from '../../src/index'

function isValidBarcodeMatrix(result: { data: number[][], width: number, height: number }) {
  expect(result.data.length).toBe(result.height)
  for (const row of result.data) {
    expect(row.length).toBe(result.width)
    for (const cell of row) {
      expect(cell === 0 || cell === 1).toBe(true)
    }
  }
}

describe('eAN8Encoder', () => {
  const encoder = new EAN8Encoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('ean8')
  })

  it('validates 7-8 digit strings', () => {
    expect(encoder.validate('1234567')).toBe(true)
    expect(encoder.validate('12345670')).toBe(true)
    expect(encoder.validate('12345671')).toBe(false)
    expect(encoder.validate('12345')).toBe(false)
    expect(encoder.validate('')).toBe(false)
    expect(encoder.validate('123456789')).toBe(false)
  })

  it('encodes 7-digit content with auto check digit', () => {
    const result = encoder.encode('9638507')
    expect(result.metadata.type).toBe('ean8')
    expect(result.metadata.contentLength).toBe(7)
    isValidBarcodeMatrix(result)
  })

  it('encodes 8-digit content with provided check digit', () => {
    const result = encoder.encode('96385074')
    expect(result.metadata.type).toBe('ean8')
    isValidBarcodeMatrix(result)
  })

  it('produces consistent output', () => {
    const a = encoder.encode('9638507')
    const b = encoder.encode('9638507')
    expect(a.data).toEqual(b.data)
  })

  it('has correct logical width when rendered without quiet zone scaling', () => {
    const result = encoder.encode('9638507', { moduleWidth: 1, quietZone: 0, verticalMargin: 0 })
    expect(result.width).toBe(67)
  })

  it('uses the EAN-8 default quiet zone', () => {
    const result = encoder.encode('9638507')
    expect(result.width).toBe((encoder.getModuleCount('9638507') + 14) * 2)
  })

  it('ean8 convenience function works', () => {
    const result = ean8('9638507')
    expect(result.metadata.type).toBe('ean8')
  })

  it('throws on invalid content', () => {
    expect(() => encoder.encode('123')).toThrow()
  })

  it('throws on unsupported includeChecksum option', () => {
    expect(() => encoder.encode('9638507', { includeChecksum: false } as never)).toThrow('EAN includeChecksum option is not supported')
  })
})

describe('uPCAEncoder', () => {
  const encoder = new UPCAEncoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('upca')
  })

  it('validates 11-12 digit strings', () => {
    expect(encoder.validate('03600029145')).toBe(true)
    expect(encoder.validate('036000291452')).toBe(true)
    expect(encoder.validate('036000291453')).toBe(false)
    expect(encoder.validate('12345')).toBe(false)
    expect(encoder.validate('')).toBe(false)
  })

  it('encodes 11-digit content with auto check digit', () => {
    const result = encoder.encode('03600029145')
    expect(result.metadata.type).toBe('upca')
    expect(result.metadata.contentLength).toBe(11)
    isValidBarcodeMatrix(result)
  })

  it('encodes 12-digit content with provided check digit', () => {
    const result = encoder.encode('036000291452')
    expect(result.metadata.type).toBe('upca')
    isValidBarcodeMatrix(result)
  })

  it('produces consistent output', () => {
    const a = encoder.encode('03600029145')
    const b = encoder.encode('03600029145')
    expect(a.data).toEqual(b.data)
  })

  it('has correct logical width when rendered without quiet zone scaling', () => {
    const result = encoder.encode('03600029145', { moduleWidth: 1, quietZone: 0, verticalMargin: 0 })
    expect(result.width).toBe(95)
  })

  it('uses the UPC-A default quiet zone', () => {
    const result = encoder.encode('03600029145')
    expect(result.width).toBe((encoder.getModuleCount('03600029145') + 18) * 2)
  })

  it('upca convenience function works', () => {
    const result = upca('03600029145')
    expect(result.metadata.type).toBe('upca')
  })

  it('throws on invalid content', () => {
    expect(() => encoder.encode('123')).toThrow()
  })

  it('throws on unsupported includeChecksum option', () => {
    expect(() => encoder.encode('03600029145', { includeChecksum: false } as never)).toThrow('EAN includeChecksum option is not supported')
  })
})
