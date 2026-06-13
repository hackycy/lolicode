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
