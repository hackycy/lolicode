import type { EncodableCodeType } from '@lolicode/core'
import type { LolicodeRenderer } from '@lolicode/vue'
import { Lolicode } from '@lolicode/vue'
import { computed, createApp, defineComponent, h, ref } from 'vue'
import './styles.css'

type PlaygroundCodeType = Extract<EncodableCodeType, 'qrcode' | 'datamatrix' | 'pdf417' | 'aztec' | 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca' | 'itf'>

interface Preset {
  content: string
  label: string
  type: PlaygroundCodeType
}

interface Example {
  content: string
  encode?: Record<string, number | string>
  renderer: LolicodeRenderer
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

const examples: Example[] = [
  { title: 'SVG QR', renderer: 'svg', type: 'qrcode', content: 'https://lolicode.dev', encode: { margin: 2 } },
  { title: 'Canvas barcode', renderer: 'canvas', type: 'code128', content: 'ABC123' },
]

const rendererOptions: LolicodeRenderer[] = ['svg', 'canvas']

function encodeOptions(type: PlaygroundCodeType, margin: number): Record<string, number> | undefined {
  if (type === 'qrcode' || type === 'datamatrix' || type === 'pdf417' || type === 'aztec')
    return { margin }
  return undefined
}

function propString(name: string, value: string): string {
  return `${name}="${value}"`
}

function codeSample(example: Example): string {
  const props = [
    propString('renderer', example.renderer),
    propString('type', example.type),
    propString('content', example.content),
  ]

  if (example.encode !== undefined)
    props.push(`:encode="${JSON.stringify(example.encode).replaceAll('"', '\'')}"`)

  return [
    'import { Lolicode } from \'@lolicode/vue\'',
    '',
    `<Lolicode ${props.join(' ')} />`,
  ].join('\n')
}

const App = defineComponent({
  name: 'PlaygroundApp',
  setup() {
    const activePreset = ref(0)
    const renderer = ref<LolicodeRenderer>('svg')
    const content = ref(presets[0].content)
    const moduleSize = ref(6)
    const margin = ref(1)
    const foreground = ref('#111827')
    const background = ref('#f8fafc')

    const type = computed(() => presets[activePreset.value].type)
    const encode = computed(() => encodeOptions(type.value, margin.value))

    const currentSample = computed(() => {
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
            h('p', 'Vue renderer playground'),
          ]),
        ]),
        h('div', { 'aria-label': 'Renderer', 'class': 'renderer-tabs', 'role': 'tablist' }, rendererOptions.map(option =>
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
        h('div', { 'aria-label': 'Code presets', 'class': 'preset-list', 'role': 'listbox' }, presets.map((preset, index) =>
          h('button', {
            'aria-pressed': activePreset.value === index,
            'class': 'preset-button',
            'onClick': () => choosePreset(index),
            'type': 'button',
          }, preset.label),
        )),
      ]),

      h('section', { class: 'workspace' }, [
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
            h('span', 'Module'),
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

        h('section', { class: 'hero-preview' }, [
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
          h('pre', { class: 'code-sample' }, currentSample.value),
        ]),

        h('section', { class: 'example-grid' }, examples.map(example =>
          h('article', { class: 'example-panel' }, [
            h('div', { class: 'panel-header' }, [
              h('h2', example.title),
              h('span', example.renderer),
            ]),
            h('div', { class: 'example-stage' }, [
              h(Lolicode, {
                content: example.content,
                encode: example.encode,
                moduleSize: 5,
                renderer: example.renderer,
                type: example.type,
              }),
            ]),
            h('pre', { class: 'code-sample compact' }, codeSample(example)),
          ]),
        )),
      ]),
    ])
  },
})

createApp(App).mount('#app')
