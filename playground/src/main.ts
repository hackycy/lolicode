import { renderTerminal } from '@lolicode/renderer-terminal'

function section(title: string): void {
  console.log()
  console.log(`${'='.repeat(50)}`)
  console.log(`  ${title}`)
  console.log(`${'='.repeat(50)}`)
  console.log()
}

// ─── Three Rendering Modes ──────────────────────────

section('QR Code - UTF8 Mode (default, most compact)')
console.log(renderTerminal('LOLI', { type: 'qrcode', encode: { margin: 1 } }))

section('QR Code - ANSI Mode (color background)')
console.log(renderTerminal('LOLI', { type: 'qrcode', encode: { margin: 1 }, mode: 'ansi' }))

section('QR Code - Small Mode (ANSI + half-blocks)')
console.log(renderTerminal('LOLI', { type: 'qrcode', encode: { margin: 1 }, mode: 'small' }))

// ─── Options Demo ───────────────────────────────────

section('QR Code - With Margin (2 modules)')
console.log(renderTerminal('LOLI', { type: 'qrcode', encode: { margin: 2 } }))

section('QR Code - Inverted')
console.log(renderTerminal('LOLI', { type: 'qrcode', encode: { margin: 1 }, invert: true }))

// ─── Different Sizes ────────────────────────────────

section('QR Code - Short Text (compact)')
console.log(renderTerminal('HI', { type: 'qrcode', encode: { margin: 1 } }))

section('QR Code - Long URL')
console.log(renderTerminal('https://github.com/hackycy/lolicode', { type: 'qrcode', encode: { margin: 1 } }))

// ─── 2D Codes ───────────────────────────────────────

section('Data Matrix')
console.log(renderTerminal('Hi', { type: 'datamatrix' }))

section('PDF417')
console.log(renderTerminal('test', { type: 'pdf417' }))

section('Aztec Code')
console.log(renderTerminal('ABC', { type: 'aztec' }))

// ─── Barcodes ───────────────────────────────────────

section('Code 128')
console.log(renderTerminal('Hello', { type: 'code128' }))

section('EAN-13')
console.log(renderTerminal('590123412345', { type: 'ean13' }))

section('EAN-8')
console.log(renderTerminal('96385074', { type: 'ean8' }))

section('UPC-A')
console.log(renderTerminal('036000291452', { type: 'upca' }))

section('UPC-E')
console.log(renderTerminal('01234565', { type: 'upce' }))

section('Code 39')
console.log(renderTerminal('CODE39', { type: 'code39' }))

section('ITF')
console.log(renderTerminal('1234567890', { type: 'itf' }))

section('Codabar')
console.log(renderTerminal('A12345B', { type: 'codabar' }))

section('GS1-128')
console.log(renderTerminal('(01)09521234543213', { type: 'gs1_128' }))

section('MSI Plessey')
console.log(renderTerminal('12345', { type: 'msi' }))
