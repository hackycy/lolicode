import type { DotValue } from '../types'
import bwipjs from 'bwip-js'

type BwipRawSymbol
  = | { bbs: number[], bhs: number[], sbs: number[] }
    | { height: number, pixs: number[], pixx: number, pixy: number, width: number }

type BwipOptions = Record<string, unknown>

function getSingleRawSymbol(bcid: string, content: string, options?: BwipOptions): BwipRawSymbol {
  const symbols = bwipjs.raw(bcid, content, options)
  if (symbols.length !== 1)
    throw new Error(`Expected one ${bcid} symbol, received ${symbols.length}`)
  return symbols[0]
}

export function getBwipMatrix(bcid: string, content: string, options?: BwipOptions): DotValue[][] {
  const symbol = getSingleRawSymbol(bcid, content, options)
  if (!('pixs' in symbol))
    throw new Error(`${bcid} did not produce a pixel matrix`)

  const matrix: DotValue[][] = []
  for (let row = 0; row < symbol.pixy; row++) {
    const outRow: DotValue[] = []
    for (let col = 0; col < symbol.pixx; col++)
      outRow.push(symbol.pixs[row * symbol.pixx + col] === 0 ? 0 : 1)
    matrix.push(outRow)
  }
  return matrix
}

export function getBwipRuns(bcid: string, content: string, options?: BwipOptions): number[] {
  const symbol = getSingleRawSymbol(bcid, content, options)
  if (!('sbs' in symbol))
    throw new Error(`${bcid} did not produce a linear symbol`)
  return symbol.sbs
}

export function canEncodeWithBwip(bcid: string, content: string, options?: BwipOptions): boolean {
  try {
    getSingleRawSymbol(bcid, content, options)
    return true
  }
  catch {
    return false
  }
}
