import { renderSVG } from '@lolicode/renderer-svg'
import { renderTerminal } from '@lolicode/renderer-terminal'

function section(title: string): void {
  console.log()
  console.log(`${'='.repeat(50)}`)
  console.log(`  ${title}`)
  console.log(`${'='.repeat(50)}`)
  console.log()
}

section('QR Code - UTF8 Mode')
console.log(renderTerminal('LOLI', { type: 'qrcode', encode: { margin: 1 } }))

section('QR Code - ANSI Mode')
console.log(renderTerminal('LOLI', { type: 'qrcode', encode: { margin: 1 }, mode: 'ansi' }))

section('QR Code - Small Mode')
console.log(renderTerminal('LOLI', { type: 'qrcode', encode: { margin: 1 }, mode: 'small' }))

section('Data Matrix')
console.log(renderTerminal('Hi', { type: 'datamatrix' }))

section('PDF417')
console.log(renderTerminal('test', { type: 'pdf417' }))

section('Aztec Code')
console.log(renderTerminal('ABC', { type: 'aztec' }))

section('SVG - Code 128')
console.log(renderSVG('ABC123', { type: 'code128', moduleSize: 2 }).slice(0, 320))
console.log('...')
