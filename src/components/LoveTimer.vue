<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { START_DATE, ANNIVERSARY_DAY } from '../config.js'
import ParticleText from './ParticleText.vue'

const now = ref(new Date())
let timer
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

// Ближайшее «наше число» (15-е) в будущем
const target = computed(() => {
  const n = now.value
  let t = new Date(n.getFullYear(), n.getMonth(), ANNIVERSARY_DAY, 0, 0, 0)
  if (t <= n) t = new Date(n.getFullYear(), n.getMonth() + 1, ANNIVERSARY_DAY, 0, 0, 0)
  return t
})

// Предыдущее «наше число» — для полосы прогресса
const prev = computed(() => {
  const t = target.value
  return new Date(t.getFullYear(), t.getMonth() - 1, ANNIVERSARY_DAY, 0, 0, 0)
})

const remaining = computed(() => Math.max(0, target.value - now.value))

const parts = computed(() => {
  const s = Math.floor(remaining.value / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
})

const pad = (n) => String(n).padStart(2, '0')

// Какой это будет по счёту месяц вместе
const monthNumber = computed(() => {
  const t = target.value
  return (t.getFullYear() - START_DATE.getFullYear()) * 12 + (t.getMonth() - START_DATE.getMonth())
})

const headText = computed(() => `До ${monthNumber.value} ${monthNumber.value === 1 ? 'месяца' : 'месяцев'}`)

const progress = computed(() => {
  const total = target.value - prev.value
  return Math.min(1, Math.max(0, (now.value - prev.value) / total))
})

const targetLabel = computed(() =>
  target.value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
)

const cells = computed(() => [
  { v: parts.value.days, label: 'дней' },
  { v: pad(parts.value.hours), label: 'часов' },
  { v: pad(parts.value.minutes), label: 'минут' },
  { v: pad(parts.value.seconds), label: 'секунд' },
])
</script>

<template>
  <section class="timer">
    <ParticleText :text="headText" height="clamp(46px, 8vw, 78px)" class="head" />

    <div class="grid">
      <div v-for="c in cells" :key="c.label" class="cell">
        <div class="num display">{{ c.v }}</div>
        <div class="lbl">{{ c.label }}</div>
      </div>
    </div>

    <div class="track">
      <div class="fill" :style="{ width: (progress * 100).toFixed(2) + '%' }"></div>
    </div>
  </section>
</template>

<style scoped>
.timer {
  position: relative;
  z-index: 2;
  width: 100%;
  animation: riseIn 0.8s ease both;
}

.eyebrow {
  margin-bottom: 16px;
}

.head {
  font-size: clamp(28px, 6vw, 56px);
  font-weight: 400;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--white);
  margin-bottom: 44px;
}
.accent {
  color: var(--iris);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(14px, 4vw, 48px);
}

.cell {
  text-align: left;
}

.num {
  font-size: clamp(40px, 11vw, 96px);
  color: var(--white);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.lbl {
  margin-top: 14px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ash);
}

.track {
  margin-top: 48px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  width: 100%;
}
.fill {
  height: 100%;
  background: var(--iris);
  transition: width 0.6s ease;
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 28px 24px;
  }
}
</style>
