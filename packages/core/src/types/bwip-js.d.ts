declare module 'bwip-js' {
  type BwipRawSymbol
    = | { bbs: number[], bhs: number[], sbs: number[] }
      | { height: number, pixs: number[], pixx: number, pixy: number, width: number }

  const bwipjs: {
    raw: (
      bcid: string,
      content: string,
      options?: Record<string, unknown>,
    ) => BwipRawSymbol[]
  }

  export default bwipjs
}
