import { describe, expect, it } from 'vitest'
import { CodabarEncoder } from '../../src/encoders/barcode/codabar'
import { Code93Encoder } from '../../src/encoders/barcode/code93'
import { MSIEncoder } from '../../src/encoders/barcode/msi'
import { UPCEncoder } from '../../src/encoders/barcode/upce'

function isValidBarcodeMatrix(result: { data: number[][], width: number, height: number }) {
  expect(result.data.length).toBe(result.height)
  for (const row of result.data) {
    expect(row.length).toBe(result.width)
    for (const cell of row) {
      expect(cell === 0 || cell === 1).toBe(true)
    }
  }
}

function runsToBits(runs: number[]): string {
  let isBar = true
  let bits = ''
  for (const run of runs) {
    bits += (isBar ? '1' : '0').repeat(run)
    isBar = !isBar
  }
  return bits
}

describe('uPCEncoder', () => {
  const encoder = new UPCEncoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('upce')
  })

  it('validates 6-8 digit strings', () => {
    expect(encoder.validate('012345')).toBe(true)
    expect(encoder.validate('01234565')).toBe(true)
    expect(encoder.validate('00123457')).toBe(true)
    expect(encoder.validate('0123456')).toBe(false)
    expect(encoder.validate('12345')).toBe(false)
    expect(encoder.validate('')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('012345')
    expect(result.metadata.type).toBe('upce')
    isValidBarcodeMatrix(result)
  })

  it('produces consistent output', () => {
    const a = encoder.encode('012345')
    const b = encoder.encode('012345')
    expect(a.data).toEqual(b.data)
  })

  it('has correct logical width when rendered without quiet zone scaling', () => {
    const result = encoder.encode('012345', { moduleWidth: 1, quietZone: 0, verticalMargin: 0 })
    expect(result.width).toBe(51)
  })

  it('uses the UPC-E default quiet zone', () => {
    const result = encoder.encode('012345')
    expect(result.width).toBe((encoder.getModuleCount('012345') + 18) * 2)
  })

  it('throws on unsupported includeChecksum option', () => {
    expect(() => encoder.encode('012345', { includeChecksum: false } as never)).toThrow('EAN includeChecksum option is not supported')
  })
})

describe('code93Encoder', () => {
  const encoder = new Code93Encoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('code93')
  })

  it('validates valid characters', () => {
    expect(encoder.validate('ABC 123')).toBe(true)
    expect(encoder.validate('TEST-123')).toBe(true)
    expect(encoder.validate('')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('CODE 93')
    expect(result.metadata.type).toBe('code93')
    isValidBarcodeMatrix(result)
  })

  it('uses the Code 93 start and stop pattern with termination bar', () => {
    const runs = encoder.encodeToRuns('0')
    expect(runs.slice(0, 6)).toEqual([1, 1, 1, 1, 4, 1])
    expect(runs.reduce((sum, run) => sum + run, 0)).toBe(46)
  })

  it('uses the standard Code 93 pattern table for data characters', () => {
    expect(runsToBits(encoder.encodeToRuns('L')).slice(0, 18)).toBe('101011110101011000')
  })

  it('produces consistent output', () => {
    const a = encoder.encode('TEST')
    const b = encoder.encode('TEST')
    expect(a.data).toEqual(b.data)
  })

  it('throws on invalid content', () => {
    expect(() => encoder.encode('')).toThrow()
  })
})

describe('codabarEncoder', () => {
  const encoder = new CodabarEncoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('codabar')
  })

  it('validates valid characters', () => {
    expect(encoder.validate('A12345B')).toBe(true)
    expect(encoder.validate('123456')).toBe(false)
    expect(encoder.validate('A12B45C')).toBe(false)
    expect(encoder.validate('')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('A12345B')
    expect(result.metadata.type).toBe('codabar')
    isValidBarcodeMatrix(result)
  })

  it('produces consistent output', () => {
    const a = encoder.encode('A123456B')
    const b = encoder.encode('A123456B')
    expect(a.data).toEqual(b.data)
  })

  it('throws on invalid content', () => {
    expect(() => encoder.encode('')).toThrow()
  })
})

describe('mSIEncoder', () => {
  const encoder = new MSIEncoder()

  it('returns correct type', () => {
    expect(encoder.getType()).toBe('msi')
  })

  it('validates numeric content', () => {
    expect(encoder.validate('1234567890')).toBe(true)
    expect(encoder.validate('12345')).toBe(true)
    expect(encoder.validate('')).toBe(false)
    expect(encoder.validate('abc')).toBe(false)
  })

  it('encodes to valid matrix', () => {
    const result = encoder.encode('1234567890')
    expect(result.metadata.type).toBe('msi')
    isValidBarcodeMatrix(result)
  })

  it('produces consistent output', () => {
    const a = encoder.encode('12345')
    const b = encoder.encode('12345')
    expect(a.data).toEqual(b.data)
  })

  it('throws on invalid content', () => {
    expect(() => encoder.encode('')).toThrow()
  })
})
