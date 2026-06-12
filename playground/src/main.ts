import {
  addMargin as addMatrixMargin,
  aztec,
  codabar,
  code39,
  code128,
  dataMatrix,
  ean8,
  ean13,
  gs1_128,
  itf,
  msi,
  pdf417,
  qr,
  resizeMatrix,
  upca,
  upce,
} from '@lolicode/core'
import { renderTerminal } from '@lolicode/renderer-terminal'

const barcodeMatrixOptions = {
  height: 12,
  moduleWidth: 1,
  quietZone: 2,
  verticalMargin: 0,
}

const barcodeTerminalOptions = {
  barHeight: 4,
  maxWidth: 60,
}

function section(title: string): void {
  console.log()
  console.log(`${'='.repeat(50)}`)
  console.log(`  ${title}`)
  console.log(`${'='.repeat(50)}`)
  console.log()
}

// ─── Three Rendering Modes ──────────────────────────

const qrMatrix = qr('LOLI')
const qrData = addMatrixMargin(qrMatrix, 1).data

section('QR Code - UTF8 Mode (default, most compact)')
console.log(renderTerminal(qrData))

section('QR Code - ANSI Mode (color background)')
console.log(renderTerminal(qrData, { mode: 'ansi' }))

section('QR Code - Small Mode (ANSI + half-blocks)')
console.log(renderTerminal(qrData, { mode: 'small' }))

// ─── Options Demo ───────────────────────────────────

section('QR Code - With Margin (2 modules)')
console.log(renderTerminal(qrMatrix.data, { margin: 2 }))

section('QR Code - Inverted')
console.log(renderTerminal(qrData, { invert: true }))

// ─── Different Sizes ────────────────────────────────

section('QR Code - Short Text (compact)')
console.log(renderTerminal(addMatrixMargin(qr('HI'), 1).data))

section('QR Code - Long URL')
console.log(renderTerminal(addMatrixMargin(qr('https://github.com/hackycy/lolicode'), 1).data))

section('QR Code - Scaled 2x')
console.log(renderTerminal(resizeMatrix(qrMatrix, 2).data))

// ─── 2D Codes ───────────────────────────────────────

section('Data Matrix')
console.log(renderTerminal(dataMatrix('Hi').data))

section('PDF417')
console.log(renderTerminal(pdf417('test').data))

section('Aztec Code')
console.log(renderTerminal(aztec('ABC').data))

// ─── Barcodes ───────────────────────────────────────

section('Code 128')
console.log(renderTerminal(code128('Hello', barcodeMatrixOptions), barcodeTerminalOptions))

section('EAN-13')
console.log(renderTerminal(ean13('590123412345', barcodeMatrixOptions), barcodeTerminalOptions))

section('EAN-8')
console.log(renderTerminal(ean8('96385074', barcodeMatrixOptions), barcodeTerminalOptions))

section('UPC-A')
console.log(renderTerminal(upca('036000291452', barcodeMatrixOptions), barcodeTerminalOptions))

section('UPC-E')
console.log(renderTerminal(upce('01234565', barcodeMatrixOptions), barcodeTerminalOptions))

section('Code 39')
console.log(renderTerminal(code39('CODE39', barcodeMatrixOptions), barcodeTerminalOptions))

section('ITF')
console.log(renderTerminal(itf('1234567890', barcodeMatrixOptions), barcodeTerminalOptions))

section('Codabar')
console.log(renderTerminal(codabar('A12345B', barcodeMatrixOptions), barcodeTerminalOptions))

section('GS1-128')
console.log(renderTerminal(gs1_128('(01)09521234543213', barcodeMatrixOptions), barcodeTerminalOptions))

section('MSI Plessey')
console.log(renderTerminal(msi('12345', barcodeMatrixOptions), barcodeTerminalOptions))
