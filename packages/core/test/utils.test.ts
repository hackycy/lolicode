import type { DotMatrix, DotValue } from '../src/types'
import { describe, expect, it } from 'vitest'
import { addMargin, invertMatrix, resizeMatrix, validateContent } from '../src/utils/bit-matrix'
import { getAlphanumericValue, getBytes, isAlphanumeric, isNumeric } from '../src/utils/encoding'
import { calculateEANCheckDigit, isEmpty, isLengthValid, isNumericString, isValidCode39, isValidEAN13, isValidITF } from '../src/utils/validation'

function makeMatrix(data: DotValue[][]): DotMatrix {
  return {
    data,
    width: data[0]?.length ?? 0,
    height: data.length,
    metadata: { type: 'qrcode', family: 'matrix', generatedAt: 0 },
  }
}

describe('bit-matrix utils', () => {
  describe('addMargin', () => {
    it('adds margin around matrix', () => {
      const matrix = makeMatrix([
        [1, 0],
        [0, 1],
      ])
      const result = addMargin(matrix, 1)

      expect(result.width).toBe(4)
      expect(result.height).toBe(4)
      expect(result.data).toEqual([
        [0, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ])
    })

    it('returns same matrix when margin is 0', () => {
      const matrix = makeMatrix([[1]])
      const result = addMargin(matrix, 0)
      expect(result).toBe(matrix)
    })
  })

  describe('invertMatrix', () => {
    it('flips all values', () => {
      const matrix = makeMatrix([
        [1, 0],
        [0, 1],
      ])
      const result = invertMatrix(matrix)
      expect(result.data).toEqual([
        [0, 1],
        [1, 0],
      ])
    })
  })

  describe('resizeMatrix', () => {
    it('scales up by factor', () => {
      const matrix = makeMatrix([
        [1, 0],
        [0, 1],
      ])
      const result = resizeMatrix(matrix, 2)

      expect(result.width).toBe(4)
      expect(result.height).toBe(4)
      expect(result.data).toEqual([
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1],
      ])
    })

    it('returns same matrix when scale is 1', () => {
      const matrix = makeMatrix([[1]])
      const result = resizeMatrix(matrix, 1)
      expect(result).toBe(matrix)
    })
  })

  describe('validateContent', () => {
    it('returns true for valid content', () => {
      expect(validateContent('hello', 10)).toBe(true)
    })

    it('returns false for empty content', () => {
      expect(validateContent('', 10)).toBe(false)
    })

    it('returns false when exceeding max length', () => {
      expect(validateContent('hello', 3)).toBe(false)
    })
  })
})

describe('encoding utils', () => {
  describe('getBytes', () => {
    it('encodes ASCII', () => {
      expect(getBytes('ABC')).toEqual([65, 66, 67])
    })

    it('matches standard UTF-8 encoding for surrogate edge cases', () => {
      expect(getBytes('😀')).toEqual(Array.from(new TextEncoder().encode('😀')))
      expect(getBytes('\uD800')).toEqual(Array.from(new TextEncoder().encode('\uD800')))
      expect(getBytes('\uDC00')).toEqual(Array.from(new TextEncoder().encode('\uDC00')))
    })
  })

  describe('isNumeric', () => {
    it('returns true for digits', () => {
      expect(isNumeric('12345')).toBe(true)
    })

    it('returns false for non-digits', () => {
      expect(isNumeric('12a45')).toBe(false)
    })
  })

  describe('isAlphanumeric', () => {
    it('returns true for valid chars', () => {
      expect(isAlphanumeric('HELLO 123')).toBe(true)
    })

    it('returns false for lowercase', () => {
      expect(isAlphanumeric('hello')).toBe(false)
    })
  })

  describe('getAlphanumericValue', () => {
    it('returns correct values', () => {
      expect(getAlphanumericValue('0')).toBe(0)
      expect(getAlphanumericValue('9')).toBe(9)
      expect(getAlphanumericValue('A')).toBe(10)
      expect(getAlphanumericValue('Z')).toBe(35)
    })

    it('returns -1 for invalid char', () => {
      expect(getAlphanumericValue('a')).toBe(-1)
    })
  })
})

describe('validation utils', () => {
  describe('isEmpty', () => {
    it('detects empty string', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('a')).toBe(false)
    })
  })

  describe('isLengthValid', () => {
    it('validates length range', () => {
      expect(isLengthValid('abc', 5)).toBe(true)
      expect(isLengthValid('', 5)).toBe(false)
      expect(isLengthValid('abcdef', 5)).toBe(false)
    })
  })

  describe('isNumericString', () => {
    it('validates numeric strings', () => {
      expect(isNumericString('123')).toBe(true)
      expect(isNumericString('12a3')).toBe(false)
    })
  })

  describe('isValidEAN13', () => {
    it('accepts 12-13 digit strings', () => {
      expect(isValidEAN13('123456789012')).toBe(true)
      expect(isValidEAN13('4006381333931')).toBe(true)
      expect(isValidEAN13('12345')).toBe(false)
    })

    it('rejects invalid provided check digits', () => {
      expect(isValidEAN13('4006381333932')).toBe(false)
    })
  })

  describe('isValidCode39', () => {
    it('accepts valid chars', () => {
      expect(isValidCode39('ABC 123')).toBe(true)
      expect(isValidCode39('abc')).toBe(false)
    })
  })

  describe('isValidITF', () => {
    it('requires even-length digits', () => {
      expect(isValidITF('1234')).toBe(true)
      expect(isValidITF('123')).toBe(false)
    })
  })

  describe('calculateEANCheckDigit', () => {
    it('calculates correct check digit', () => {
      // EAN-13 for "4006381333931" -> check digit should be 1
      expect(calculateEANCheckDigit([4, 0, 0, 6, 3, 8, 1, 3, 3, 3, 9, 3])).toBe(1)
    })
  })
})
