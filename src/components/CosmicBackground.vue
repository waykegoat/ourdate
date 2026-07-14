<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'

const canvas = ref(null)
let renderer, scene, camera, animId, cloud, material, glow
let disposed = false
let baseOpacity = 0.9
const pointer = { x: 0, y: 0 }

// Текстура частицы — тонкий контурный треугольник (фирменный глиф)
function triangleTexture() {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, s, s)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 5
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(s * 0.5, s * 0.2)
  ctx.lineTo(s * 0.82, s * 0.78)
  ctx.lineTo(s * 0.18, s * 0.78)
  ctx.closePath()
  ctx.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 2
  return tex
}

// Мягкое радиальное свечение для ореола за сердцем
function glowTexture() {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(c)
}

// (x² + y² − 1)³ − x²·y³ ≤ 0 — сердце: доли сверху, остриё снизу
function insideHeart(x, y) {
  const a = x * x + y * y - 1
  return a * a * a - x * x * y * y * y <= 0
}

function pickColor() {
  const r = Math.random()
  if (r < 0.42) return new THREE.Color('#e7e2f7')
  if (r < 0.74) return new THREE.Color('#8052ff')
  if (r < 0.86) return new THREE.Color('#b3a9d6')
  if (r < 0.95) return new THREE.Color('#ffb829')
  return new THREE.Color('#15846e')
}

function buildCloud() {
  const heartN = 2600
  const ambientN = 260
  const total = heartN + ambientN
  const positions = new Float32Array(total * 3)
  const colors = new Float32Array(total * 3)
  const scales = new Float32Array(total)
  const phases = new Float32Array(total)
  const twinkle = new Float32Array(total) // насколько сильно мерцает

  const HEART_SCALE = 2.5
  const DEPTH = 1.2

  let placed = 0
  while (placed < heartN) {
    const x = (Math.random() * 2 - 1) * 1.35
    const y = (Math.random() * 2 - 1) * 1.35
    if (!insideHeart(x, y)) continue
    const i = placed
    positions[i * 3] = x * HEART_SCALE
    positions[i * 3 + 1] = (y + 0.15) * HEART_SCALE
    positions[i * 3 + 2] = (Math.random() - 0.5) * DEPTH
    scales[i] = 0.6 + Math.random() * 0.75
    phases[i] = Math.random() * Math.PI * 2
    twinkle[i] = 0.35 + Math.random() * 0.45
    const col = pickColor()
    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b
    placed++
  }

  for (let i = heartN; i < total; i++) {
    const rad = 5 + Math.random() * 8
    const a = Math.random() * Math.PI * 2
    positions[i * 3] = Math.cos(a) * rad
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = Math.sin(a) * rad - 3
    scales[i] = 0.18 + Math.random() * 0.22
    phases[i] = Math.random() * Math.PI * 2
    twinkle[i] = 0.6 + Math.random() * 0.4
    const col = pickColor().multiplyScalar(0.6)
    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('ascale', new THREE.BufferAttribute(scales, 1))
  geo.setAttribute('aphase', new THREE.BufferAttribute(phases, 1))
  geo.setAttribute('atwinkle', new THREE.BufferAttribute(twinkle, 1))

  material = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: triangleTexture() },
      uSize: { value: 98.0 },
      uOpacity: { value: baseOpacity },
      uTime: { value: 0 },
    },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    vertexShader: `
      attribute float ascale;
      attribute float aphase;
      attribute float atwinkle;
      varying vec3 vColor;
      varying float vTw;
      uniform float uSize;
      uniform float uTime;
      void main() {
        vColor = color;
        // индивидуальное мерцание частицы
        vTw = 1.0 - atwinkle * (0.5 + 0.5 * sin(uTime * 1.6 + aphase));
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * ascale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTex;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTw;
      void main() {
        vec4 t = texture2D(uTex, gl_PointCoord);
        if (t.a < 0.08) discard;
        gl_FragColor = vec4(vColor, t.a * uOpacity * vTw);
      }
    `,
  })

  const points = new THREE.Points(geo, material)

  // Ореол — мягкое фиолетовое свечение позади сердца, пульсирует вместе с ним
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: new THREE.Color('#8052ff'),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  })
  glow = new THREE.Sprite(glowMat)
  glow.position.set(0, 0.25, -0.6)
  glow.scale.set(7.5, 7.5, 1)
  points.add(glow)

  return points
}

function applyLayout() {
  const aspect = window.innerWidth / window.innerHeight
  if (aspect >= 1) {
    cloud.position.x = Math.min(3.6, Math.max(2.2, aspect * 1.7))
    cloud.position.y = 0.2
    baseOpacity = 0.92
  } else {
    cloud.position.x = 0
    cloud.position.y = 1.2
    baseOpacity = 0.24
  }
}

function init() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 0, 9)

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)

  cloud = buildCloud()
  scene.add(cloud)
  applyLayout()

  window.addEventListener('resize', onResize)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  animate()
}

function onResize() {
  if (!renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  applyLayout()
}

function onPointerMove(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1
}

let scrollFade = 1
function onScroll() {
  const y = window.scrollY || 0
  scrollFade = Math.max(0, 1 - y / 480)
}

// Сердцебиение: два толчка (lub-dub) за период
function heartbeat(t) {
  const p = (t % 1.35) / 1.35
  const b1 = Math.exp(-Math.pow((p - 0.12) / 0.055, 2))
  const b2 = 0.55 * Math.exp(-Math.pow((p - 0.32) / 0.055, 2))
  return b1 + b2
}

const clock = new THREE.Clock()
function animate() {
  if (disposed) return
  animId = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  if (cloud) {
    cloud.rotation.y = Math.sin(t * 0.25) * 0.1 + pointer.x * 0.08
    cloud.rotation.x = Math.sin(t * 0.2) * 0.035 - pointer.y * 0.04
    const beat = heartbeat(t)
    const s = 1 + beat * 0.05
    cloud.scale.set(s, s, s)
    if (glow) glow.material.opacity = 0.4 + beat * 0.35
  }
  if (material) {
    material.uniforms.uTime.value = t
    material.uniforms.uOpacity.value = baseOpacity * scrollFade
  }

  renderer.render(scene, camera)
}

onMounted(init)

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('scroll', onScroll)
  scene?.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
    if (o.material) {
      if (o.material.map) o.material.map.dispose()
      if (o.material.uniforms?.uTex?.value) o.material.uniforms.uTex.value.dispose()
      o.material.dispose()
    }
  })
  renderer?.dispose()
})
</script>

<template>
  <div class="atmosphere"></div>
  <canvas ref="canvas" class="constellation"></canvas>
</template>

<style scoped>
/* Атмосферная подсветка фона — войд перестаёт быть плоско-чёрным */
.atmosphere {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(46% 55% at 74% 42%, rgba(128, 82, 255, 0.18), transparent 72%),
    radial-gradient(38% 45% at 12% 88%, rgba(128, 82, 255, 0.08), transparent 70%),
    radial-gradient(30% 40% at 88% 20%, rgba(255, 184, 41, 0.05), transparent 70%);
}

.constellation {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

@media (max-width: 760px) {
  .atmosphere {
    background:
      radial-gradient(60% 40% at 50% 22%, rgba(128, 82, 255, 0.16), transparent 72%),
      radial-gradient(50% 40% at 50% 90%, rgba(128, 82, 255, 0.06), transparent 70%);
  }
}
</style>
