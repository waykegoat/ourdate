<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  clickable: { type: Boolean, default: false },
  height: { type: String, default: 'clamp(84px, 15vw, 150px)' },
})
const emit = defineEmits(['activate'])

const wrap = ref(null)
const cv = ref(null)
let ctx, raf, particles = [], disposed = false, dpr = 1
let W = 0, H = 0
const mouse = { x: -9999, y: -9999 }
let ro

// Для читаемости преобладает белый/светлый, акценты — фиолетовый и янтарь
const PALETTE = ['#ffffff', '#ffffff', '#f1ecfd', '#f1ecfd', '#cdc2f0', '#a688ff', '#ffb829']

function fitFontSize(octx, text, maxW, maxH) {
  let fs = maxH
  octx.font = `400 ${fs}px Inter, sans-serif`
  let w = octx.measureText(text).width
  if (w > maxW) fs = Math.floor(fs * (maxW / w))
  return Math.max(24, fs)
}

async function build() {
  if (!wrap.value || !cv.value) return
  await document.fonts.ready
  W = wrap.value.clientWidth
  H = wrap.value.clientHeight
  if (W === 0 || H === 0) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  cv.value.width = W * dpr
  cv.value.height = H * dpr
  cv.value.style.width = W + 'px'
  cv.value.style.height = H + 'px'
  ctx = cv.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Рисуем текст на офскрин-канвас и снимаем пиксели
  const off = document.createElement('canvas')
  off.width = W
  off.height = H
  const octx = off.getContext('2d')
  const fs = fitFontSize(octx, props.text, W * 0.98, H * 0.82)
  octx.fillStyle = '#fff'
  octx.textBaseline = 'middle'
  octx.textAlign = 'left'
  octx.font = `400 ${fs}px Inter, sans-serif`
  octx.fillText(props.text, 0, H / 2)
  const data = octx.getImageData(0, 0, W, H).data

  const step = Math.max(3, Math.round(fs / 40))
  const next = []
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 130) {
        next.push({
          tx: x + (Math.random() - 0.5) * step,
          ty: y + (Math.random() - 0.5) * step,
          x: Math.random() * W,
          y: Math.random() * H,
          c: PALETTE[(Math.random() * PALETTE.length) | 0],
          s: 1.7 + Math.random() * 1.7,
          ph: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI,
        })
      }
    }
  }
  particles = next
}

function tri(x, y, s, rot) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.moveTo(0, -s)
  ctx.lineTo(s * 0.9, s * 0.7)
  ctx.lineTo(-s * 0.9, s * 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

let t = 0
function frame() {
  if (disposed) return
  raf = requestAnimationFrame(frame)
  if (!ctx) return
  t += 0.016
  ctx.clearRect(0, 0, W, H)

  for (const p of particles) {
    // притяжение к цели
    let dx = p.tx - p.x
    let dy = p.ty - p.y
    p.x += dx * 0.09
    p.y += dy * 0.09

    // отталкивание от курсора
    const mx = p.x - mouse.x
    const my = p.y - mouse.y
    const d2 = mx * mx + my * my
    if (d2 < 2600) {
      const d = Math.sqrt(d2) || 1
      const f = (52 - d) / 52
      p.x += (mx / d) * f * 6
      p.y += (my / d) * f * 6
    }

    const tw = 0.78 + 0.22 * Math.sin(t * 2.2 + p.ph)
    ctx.globalAlpha = tw
    ctx.fillStyle = p.c
    tri(p.x, p.y, p.s, p.rot)
  }
  ctx.globalAlpha = 1
}

function onMove(e) {
  const r = cv.value.getBoundingClientRect()
  mouse.x = e.clientX - r.left
  mouse.y = e.clientY - r.top
}
function onLeave() {
  mouse.x = mouse.y = -9999
}
function onClick() {
  if (props.clickable) emit('activate')
}

onMounted(async () => {
  await build()
  frame()
  ro = new ResizeObserver(() => build())
  ro.observe(wrap.value)
})

watch(() => props.text, build)

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
  ro?.disconnect()
})
</script>

<template>
  <div
    ref="wrap"
    class="ptext"
    :class="{ clickable }"
    :style="{ height }"
    :role="clickable ? 'button' : null"
    :tabindex="clickable ? 0 : null"
    @pointermove="onMove"
    @pointerleave="onLeave"
    @click="onClick"
    @keydown.enter="onClick"
    @keydown.space.prevent="onClick"
  >
    <canvas ref="cv"></canvas>
  </div>
</template>

<style scoped>
.ptext {
  width: 100%;
}
.ptext.clickable {
  cursor: pointer;
}
.ptext canvas {
  display: block;
}
</style>
