import type { EncodableCodeType } from '@lolicode/core'
import { renderCanvas } from '@lolicode/renderer-canvas'
import { renderSVG } from '@lolicode/renderer-svg'
import './styles.css'

type PlaygroundCodeType = Extract<EncodableCodeType, 'qrcode' | 'datamatrix' | 'pdf417' | 'aztec' | 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca' | 'itf'>

interface Preset {
  content: string
  label: string
  type: PlaygroundCodeType
}

const presets: Preset[] = [
  { label: 'QR', type: 'qrcode', content: 'LOLI' },
  { label: 'Data Matrix', type: 'datamatrix', content: 'Hi' },
  { label: 'PDF417', type: 'pdf417', content: 'test' },
  { label: 'Aztec', type: 'aztec', content: 'ABC' },
  { label: 'Code 128', type: 'code128', content: 'ABC123' },
  { label: 'Code 39', type: 'code39', content: 'ABC 123' },
  { label: 'EAN-13', type: 'ean13', content: '400638133393' },
  { label: 'EAN-8', type: 'ean8', content: '9638507' },
  { label: 'UPC-A', type: 'upca', content: '03600029145' },
  { label: 'ITF', type: 'itf', content: '123456' },
]

const app = document.querySelector<HTMLDivElement>('#app')

if (app === null)
  throw new Error('Playground root is missing')

app.innerHTML = `
  <main class="shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">LC</span>
        <div>
          <h1>lolicode</h1>
          <p>Renderer playground</p>
        </div>
      </div>
      <div class="preset-list" role="listbox" aria-label="Code presets">
        ${presets.map((preset, index) => `
          <button class="preset-button" type="button" data-preset="${index}" aria-pressed="${index === 0}">
            ${preset.label}
          </button>
        `).join('')}
      </div>
    </aside>

    <section class="workspace">
      <form class="controls" id="controls">
        <label>
          <span>Type</span>
          <select id="type">
            ${presets.map(preset => `<option value="${preset.type}">${preset.label}</option>`).join('')}
          </select>
        </label>
        <label class="content-field">
          <span>Content</span>
          <input id="content" type="text" value="${presets[0].content}" />
        </label>
        <label>
          <span>Module</span>
          <input id="module-size" type="number" min="1" max="20" step="1" value="6" />
        </label>
        <label>
          <span>Margin</span>
          <input id="margin" type="number" min="0" max="12" step="1" value="1" />
        </label>
        <label class="color-field">
          <span>Ink</span>
          <input id="foreground" type="color" value="#111827" />
        </label>
        <label class="color-field">
          <span>Paper</span>
          <input id="background" type="color" value="#f8fafc" />
        </label>
      </form>

      <div class="preview-grid">
        <section class="preview-panel" aria-labelledby="canvas-title">
          <div class="panel-header">
            <h2 id="canvas-title">Canvas</h2>
            <output id="canvas-size"></output>
          </div>
          <div class="canvas-stage">
            <canvas id="canvas-preview"></canvas>
          </div>
        </section>

        <section class="preview-panel" aria-labelledby="svg-title">
          <div class="panel-header">
            <h2 id="svg-title">SVG</h2>
            <output id="svg-size"></output>
          </div>
          <div class="svg-stage" id="svg-preview"></div>
        </section>
      </div>

      <section class="source-panel" aria-labelledby="source-title">
        <div class="panel-header">
          <h2 id="source-title">SVG Source</h2>
          <output id="status"></output>
        </div>
        <pre id="source"></pre>
      </section>
    </section>
  </main>
`

const typeSelect = getElement<HTMLSelectElement>('type')
const contentInput = getElement<HTMLInputElement>('content')
const moduleSizeInput = getElement<HTMLInputElement>('module-size')
const marginInput = getElement<HTMLInputElement>('margin')
const foregroundInput = getElement<HTMLInputElement>('foreground')
const backgroundInput = getElement<HTMLInputElement>('background')
const canvas = getElement<HTMLCanvasElement>('canvas-preview')
const canvasSize = getElement<HTMLOutputElement>('canvas-size')
const svgSize = getElement<HTMLOutputElement>('svg-size')
const svgPreview = getElement<HTMLDivElement>('svg-preview')
const source = getElement<HTMLPreElement>('source')
const status = getElement<HTMLOutputElement>('status')
const presetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-preset]'))

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (element === null)
    throw new Error(`Missing #${id}`)
  return element as T
}

function currentType(): PlaygroundCodeType {
  return typeSelect.value as PlaygroundCodeType
}

function currentEncodeOptions(type: PlaygroundCodeType) {
  const margin = Number.parseInt(marginInput.value, 10)
  if (type === 'qrcode' || type === 'datamatrix' || type === 'pdf417' || type === 'aztec')
    return { margin }
  return undefined
}

function updatePresetState(type: PlaygroundCodeType): void {
  for (const button of presetButtons) {
    const preset = presets[Number(button.dataset.preset)]
    button.setAttribute('aria-pressed', String(preset.type === type))
  }
}

function render(): void {
  try {
    const type = currentType()
    const moduleSize = Number.parseInt(moduleSizeInput.value, 10)
    const foreground = foregroundInput.value
    const background = backgroundInput.value
    const encode = currentEncodeOptions(type)
    const svg = renderSVG(contentInput.value, {
      type,
      encode,
      moduleSize,
      foreground,
      background,
    })

    renderCanvas(contentInput.value, {
      target: canvas,
      type,
      encode,
      moduleSize,
      foreground,
      background,
    })

    svgPreview.innerHTML = svg
    source.textContent = svg
    canvasSize.value = `${canvas.width} x ${canvas.height}`
    svgSize.value = `${canvas.width} x ${canvas.height}`
    status.value = 'ready'
    updatePresetState(type)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    status.value = message
  }
}

for (const button of presetButtons) {
  button.addEventListener('click', () => {
    const preset = presets[Number(button.dataset.preset)]
    typeSelect.value = preset.type
    contentInput.value = preset.content
    render()
  })
}

typeSelect.addEventListener('change', () => {
  const preset = presets.find(item => item.type === currentType())
  if (preset !== undefined)
    contentInput.value = preset.content
  render()
})

for (const input of [contentInput, moduleSizeInput, marginInput, foregroundInput, backgroundInput])
  input.addEventListener('input', render)

render()
