import type { EncodableCodeType } from '@lolicode/core'
import type { LolicodeRenderer } from '@lolicode/vue'
import { renderCanvas } from '@lolicode/renderer-canvas'
import { renderDataURL, renderSVG } from '@lolicode/renderer-svg'
import { Lolicode } from '@lolicode/vue'
import { computed, createApp, defineComponent, h, nextTick, ref, watch } from 'vue'
import './styles.css'

type PlaygroundCodeType = Extract<EncodableCodeType, 'qrcode' | 'datamatrix' | 'pdf417' | 'aztec' | 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca' | 'itf'>
type QRErrorLevel = 'L' | 'M' | 'Q' | 'H'
type QRMode = 'auto' | 'numeric' | 'alphanumeric' | 'byte'

interface Preset {
  content: string
  label: string
  type: PlaygroundCodeType
}

interface PresetGroup {
  items: number[]
  title: string
}

interface Sample {
  content: string
  encode?: Record<string, number | string>
  output?: 'data-url'
  renderer: LolicodeRenderer | 'data-url'
  title: string
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

const presetGroups: PresetGroup[] = [
  { title: '二维码', items: [0, 1, 2, 3] },
  { title: '条形码', items: [4, 5, 6, 7, 8, 9] },
]

const componentSamples: Sample[] = [
  { title: 'Vue QR with high correction', renderer: 'svg', type: 'qrcode', content: 'https://lolicode.dev', encode: { errorLevel: 'H', margin: 2 } },
  { title: 'Vue Canvas component', renderer: 'canvas', type: 'code128', content: 'ABC123' },
]

const rendererSamples: Sample[] = [
  { title: 'renderSVG QR error level', renderer: 'svg', type: 'qrcode', content: 'LOLI', encode: { errorLevel: 'Q', margin: 1 } },
  { title: 'renderDataURL for img src', renderer: 'data-url', output: 'data-url', type: 'qrcode', content: 'https://lolicode.dev', encode: { errorLevel: 'H', margin: 2 } },
  { title: 'renderCanvas', renderer: 'canvas', type: 'ean13', content: '400638133393' },
]

const rendererOptions: LolicodeRenderer[] = ['svg', 'canvas']
const errorLevelOptions: QRErrorLevel[] = ['L', 'M', 'Q', 'H']
const modeOptions: QRMode[] = ['auto', 'numeric', 'alphanumeric', 'byte']

function encodeOptions(type: PlaygroundCodeType, margin: number, errorLevel: QRErrorLevel, version: number, mode: QRMode): Record<string, number | string> | undefined {
  if (type === 'qrcode') {
    const options: Record<string, number | string> = { errorLevel, margin }
    if (version > 0)
      options.version = version
    if (mode !== 'auto')
      options.mode = mode
    return options
  }
  if (type === 'datamatrix' || type === 'pdf417' || type === 'aztec')
    return { margin }
  return undefined
}

function propString(name: string, value: string): string {
  return `${name}="${value}"`
}

function encodeCode(encode: Record<string, number | string> | undefined): string {
  return encode === undefined ? '' : ` :encode="${JSON.stringify(encode).replaceAll('"', '\'')}"`
}

function componentCode(sample: Sample): string {
  return [
    'import { Lolicode } from \'@lolicode/vue\'',
    '',
    `<Lolicode ${[
      propString('renderer', sample.renderer),
      propString('type', sample.type),
      propString('content', sample.content),
    ].join(' ')}${encodeCode(sample.encode)} />`,
  ].join('\n')
}

function rendererCode(sample: Sample): string {
  if (sample.renderer === 'canvas') {
    return [
      'import { renderCanvas } from \'@lolicode/renderer-canvas\'',
      '',
      'renderCanvas(\'400638133393\', {',
      '  target: canvasRef.value,',
      '  type: \'ean13\',',
      '  moduleSize: 3,',
      '})',
    ].join('\n')
  }

  if (sample.renderer === 'data-url') {
    return [
      'import { renderDataURL } from \'@lolicode/renderer-svg\'',
      '',
      `const src = renderDataURL('${sample.content}', {`,
      `  type: '${sample.type}',`,
      '  encode: { errorLevel: \'H\', margin: 2 },',
      '  moduleSize: 6,',
      '})',
      '',
      '<img :src="src" alt="QR code" />',
    ].join('\n')
  }

  return [
    'import { renderSVG } from \'@lolicode/renderer-svg\'',
    '',
    `const svg = renderSVG('${sample.content}', {`,
    `  type: '${sample.type}',`,
    '  encode: { errorLevel: \'Q\', margin: 1 },',
    '  moduleSize: 6,',
    '})',
  ].join('\n')
}

const RendererSample = defineComponent({
  name: 'RendererSample',
  props: {
    sample: {
      required: true,
      type: Object as () => Sample,
    },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const dataURL = computed(() => {
      if (props.sample.renderer !== 'data-url')
        return ''

      return renderDataURL(props.sample.content, {
        encode: props.sample.encode,
        moduleSize: 6,
        type: props.sample.type,
      })
    })
    const svg = computed(() => {
      if (props.sample.renderer !== 'svg')
        return ''

      return renderSVG(props.sample.content, {
        encode: props.sample.encode,
        moduleSize: 6,
        type: props.sample.type,
      })
    })

    function drawCanvas(): void {
      if (props.sample.renderer !== 'canvas' || canvasRef.value === null)
        return

      renderCanvas(props.sample.content, {
        moduleSize: 3,
        target: canvasRef.value,
        type: props.sample.type,
      })
    }

    watch(() => props.sample, () => void nextTick(drawCanvas), { immediate: true })

    return () => h('article', { class: 'sample-card' }, [
      h('div', { class: 'sample-head' }, [
        h('span', { class: 'sample-kicker' }, 'Renderer API'),
        h('h3', props.sample.title),
      ]),
      h('div', { class: 'sample-body' }, [
        h('div', { class: 'sample-preview' }, props.sample.renderer === 'canvas'
          ? [h('canvas', { class: 'lolicode-canvas', ref: canvasRef })]
          : props.sample.renderer === 'data-url'
            ? [h('img', { alt: 'QR code data URL preview', class: 'data-url-preview', src: dataURL.value })]
            : [h('div', { class: 'lolicode-svg', innerHTML: svg.value })]),
        h('pre', { class: 'code-sample compact' }, rendererCode(props.sample)),
      ]),
    ])
  },
})

const ComponentSample = defineComponent({
  name: 'ComponentSample',
  props: {
    sample: {
      required: true,
      type: Object as () => Sample,
    },
  },
  setup(props) {
    return () => h('article', { class: 'sample-card' }, [
      h('div', { class: 'sample-head' }, [
        h('span', { class: 'sample-kicker' }, '@lolicode/vue'),
        h('h3', props.sample.title),
      ]),
      h('div', { class: 'sample-body' }, [
        h('div', { class: 'sample-preview' }, [
          h(Lolicode, {
            content: props.sample.content,
            encode: props.sample.encode,
            moduleSize: props.sample.renderer === 'canvas' ? 3 : 6,
            renderer: props.sample.renderer as LolicodeRenderer,
            type: props.sample.type,
          }),
        ]),
        h('pre', { class: 'code-sample compact' }, componentCode(props.sample)),
      ]),
    ])
  },
})

const App = defineComponent({
  name: 'PlaygroundApp',
  setup() {
    const activePreset = ref(0)
    const renderer = ref<LolicodeRenderer>('svg')
    const content = ref(presets[0].content)
    const moduleSize = ref(6)
    const margin = ref(1)
    const errorLevel = ref<QRErrorLevel>('M')
    const mode = ref<QRMode>('auto')
    const version = ref(0)
    const foreground = ref('#111827')
    const background = ref('#f8fafc')

    const type = computed(() => presets[activePreset.value].type)
    const encode = computed(() => encodeOptions(type.value, margin.value, errorLevel.value, version.value, mode.value))

    const liveSample = computed(() => {
      const props = [
        propString('renderer', renderer.value),
        propString('type', type.value),
        propString('content', content.value),
        ':module-size="moduleSize"',
        'foreground="#111827"',
        'background="#f8fafc"',
      ]

      if (encode.value !== undefined)
        props.push(':encode="encode"')

      return [
        'import { Lolicode } from \'@lolicode/vue\'',
        '',
        '// moduleSize is the render-time cell size',
        `<Lolicode ${props.join(' ')} />`,
      ].join('\n')
    })

    function choosePreset(index: number): void {
      activePreset.value = index
      content.value = presets[index].content
    }

    return () => h('main', { class: 'shell' }, [
      h('aside', { class: 'sidebar' }, [
        h('div', { class: 'brand' }, [
          h('span', { class: 'brand-mark' }, 'LC'),
          h('div', [
            h('h1', 'lolicode'),
            h('p', 'Code samples'),
          ]),
        ]),
        h('nav', { 'aria-label': 'Sections', 'class': 'toc' }, [
          h('a', { href: '#live' }, 'Live sample'),
          h('a', { href: '#vue-component' }, 'Vue component'),
          h('a', { href: '#renderer-api' }, 'Renderer API'),
        ]),
        h('div', { 'aria-label': 'Code presets', 'class': 'preset-groups', 'role': 'listbox' }, presetGroups.map(group =>
          h('section', { class: 'preset-group' }, [
            h('h2', group.title),
            h('div', { class: 'preset-list' }, group.items.map((presetIndex) => {
              const preset = presets[presetIndex]
              return h('button', {
                'aria-pressed': activePreset.value === presetIndex,
                'class': 'preset-button',
                'onClick': () => choosePreset(presetIndex),
                'type': 'button',
              }, preset.label)
            })),
          ]),
        )),
      ]),

      h('section', { class: 'workspace' }, [
        h('header', { class: 'page-header' }, [
          h('div', [
            h('p', { class: 'eyebrow' }, 'Playground as tutorial'),
            h('h2', 'Render codes with Vue components or renderer functions'),
          ]),
          h('div', { class: 'renderer-tabs', role: 'tablist' }, rendererOptions.map(option =>
            h('button', {
              'aria-selected': renderer.value === option,
              'class': 'renderer-tab',
              'onClick': () => {
                renderer.value = option
              },
              'role': 'tab',
              'type': 'button',
            }, option),
          )),
        ]),

        h('section', { class: 'lesson-card', id: 'live' }, [
          h('div', { class: 'lesson-copy' }, [
            h('span', { class: 'step-label' }, '01'),
            h('h2', 'Start with one component'),
            h('p', 'Pick a code type, change content, then copy the matching sample. QR Code exposes error correction, version, mode, and margin in encode options. Module size is the render-time cell size.'),
          ]),
          h('form', {
            class: 'controls',
            onSubmit: (event: SubmitEvent) => event.preventDefault(),
          }, [
            h('label', [
              h('span', 'Content'),
              h('input', {
                onInput: (event: Event) => {
                  content.value = (event.target as HTMLInputElement).value
                },
                type: 'text',
                value: content.value,
              }),
            ]),
            h('label', [
              h('span', 'Module Size'),
              h('input', {
                max: 20,
                min: 1,
                onInput: (event: Event) => {
                  moduleSize.value = Number((event.target as HTMLInputElement).value)
                },
                step: 1,
                type: 'number',
                value: moduleSize.value,
              }),
            ]),
            h('label', [
              h('span', 'QR Error'),
              h('select', {
                disabled: type.value !== 'qrcode',
                onChange: (event: Event) => {
                  errorLevel.value = (event.target as HTMLSelectElement).value as QRErrorLevel
                },
                value: errorLevel.value,
              }, errorLevelOptions.map(level =>
                h('option', { value: level }, `${level} correction`),
              )),
            ]),
            h('label', [
              h('span', 'QR Version'),
              h('input', {
                disabled: type.value !== 'qrcode',
                max: 40,
                min: 0,
                onInput: (event: Event) => {
                  version.value = Number((event.target as HTMLInputElement).value)
                },
                step: 1,
                type: 'number',
                value: version.value,
              }),
            ]),
            h('label', [
              h('span', 'QR Mode'),
              h('select', {
                disabled: type.value !== 'qrcode',
                onChange: (event: Event) => {
                  mode.value = (event.target as HTMLSelectElement).value as QRMode
                },
                value: mode.value,
              }, modeOptions.map(option =>
                h('option', { value: option }, option),
              )),
            ]),
            h('label', [
              h('span', 'Margin'),
              h('input', {
                max: 12,
                min: 0,
                onInput: (event: Event) => {
                  margin.value = Number((event.target as HTMLInputElement).value)
                },
                step: 1,
                type: 'number',
                value: margin.value,
              }),
            ]),
            h('label', { class: 'color-field' }, [
              h('span', 'Ink'),
              h('input', {
                onInput: (event: Event) => {
                  foreground.value = (event.target as HTMLInputElement).value
                },
                type: 'color',
                value: foreground.value,
              }),
            ]),
            h('label', { class: 'color-field' }, [
              h('span', 'Paper'),
              h('input', {
                onInput: (event: Event) => {
                  background.value = (event.target as HTMLInputElement).value
                },
                type: 'color',
                value: background.value,
              }),
            ]),
          ]),
          h('div', { class: 'hero-preview' }, [
            h('div', { class: 'preview-stage' }, [
              h(Lolicode, {
                background: background.value,
                content: content.value,
                encode: encode.value,
                foreground: foreground.value,
                moduleSize: moduleSize.value,
                renderer: renderer.value,
                type: type.value,
              }),
            ]),
            h('pre', { class: 'code-sample' }, liveSample.value),
          ]),
        ]),

        h('section', { class: 'lesson-section', id: 'vue-component' }, [
          h('div', { class: 'section-head' }, [
            h('span', { class: 'step-label' }, '02'),
            h('div', [
              h('h2', 'Use @lolicode/vue when you want a component'),
              h('p', 'The component owns rendering and updates when props change.'),
            ]),
          ]),
          h('div', { class: 'sample-grid' }, componentSamples.map(sample =>
            h(ComponentSample, { key: sample.title, sample }),
          )),
        ]),

        h('section', { class: 'lesson-section', id: 'renderer-api' }, [
          h('div', { class: 'section-head' }, [
            h('span', { class: 'step-label' }, '03'),
            h('div', [
              h('h2', 'Use renderer packages when you need direct output'),
              h('p', 'Renderer APIs are better for strings, canvas refs, exports, and custom integration code.'),
            ]),
          ]),
          h('div', { class: 'sample-grid' }, rendererSamples.map(sample =>
            h(RendererSample, { key: sample.title, sample }),
          )),
        ]),
      ]),
    ])
  },
})

createApp(App).mount('#app')
