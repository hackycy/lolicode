import type {
  CodeEncodeOptionsMap,
  EncodableCodeType,
  SVGRenderOptions,
} from '@lolicode/core'
import type { PropType } from 'vue'
import { renderCanvas } from '@lolicode/renderer-canvas'
import { renderSVG } from '@lolicode/renderer-svg'
import { defineComponent, h, nextTick, ref, watch } from 'vue'

export type LolicodeRenderer = 'svg' | 'canvas'

type EncodeOptions = CodeEncodeOptionsMap[EncodableCodeType]

export interface LolicodeProps {
  ariaLabel?: string
  background?: string
  content: string
  encode?: EncodeOptions
  foreground?: string
  includeDeclaration?: boolean
  moduleSize?: number
  renderer?: LolicodeRenderer
  type?: EncodableCodeType
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const Lolicode = defineComponent({
  name: 'Lolicode',
  props: {
    ariaLabel: String,
    background: {
      default: '#FFFFFF',
      type: String,
    },
    content: {
      required: true,
      type: String,
    },
    encode: Object as PropType<EncodeOptions>,
    foreground: {
      default: '#000000',
      type: String,
    },
    includeDeclaration: {
      default: false,
      type: Boolean,
    },
    moduleSize: {
      default: 4,
      type: Number,
    },
    renderer: {
      default: 'svg',
      type: String as PropType<LolicodeRenderer>,
    },
    type: {
      default: 'qrcode',
      type: String as PropType<EncodableCodeType>,
    },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const error = ref('')
    const svg = ref('')

    function label(): string {
      return props.ariaLabel ?? `${props.type} code`
    }

    function renderCurrent(): void {
      try {
        error.value = ''

        if (props.renderer === 'svg') {
          const options: SVGRenderOptions & {
            encode?: EncodeOptions
            type: EncodableCodeType
          } = {
            background: props.background,
            encode: props.encode,
            foreground: props.foreground,
            includeDeclaration: props.includeDeclaration,
            moduleSize: props.moduleSize,
            type: props.type,
          }

          svg.value = renderSVG(props.content, options)
          return
        }

        if (canvasRef.value === null)
          return

        renderCanvas(props.content, {
          background: props.background,
          encode: props.encode,
          foreground: props.foreground,
          moduleSize: props.moduleSize,
          target: canvasRef.value,
          type: props.type,
        })
      }
      catch (caught) {
        error.value = errorMessage(caught)
      }
    }

    watch(
      () => [
        props.background,
        props.content,
        props.encode,
        props.foreground,
        props.includeDeclaration,
        props.moduleSize,
        props.renderer,
        props.type,
      ],
      () => {
        void nextTick(renderCurrent)
      },
      { deep: true, immediate: true },
    )

    return () => {
      if (error.value !== '') {
        return h('output', {
          class: 'lolicode lolicode-error',
          role: 'alert',
        }, error.value)
      }

      if (props.renderer === 'canvas') {
        return h('canvas', {
          'aria-label': label(),
          'class': 'lolicode lolicode-canvas',
          'ref': canvasRef,
          'role': 'img',
        })
      }

      return h('div', {
        'aria-label': label(),
        'class': 'lolicode lolicode-svg',
        'innerHTML': svg.value,
        'role': 'img',
      })
    }
  },
})
