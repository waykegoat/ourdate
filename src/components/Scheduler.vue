<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ACTIVITY_SUGGESTIONS } from '../config.js'
import ParticleText from './ParticleText.vue'

const STORAGE_KEY = 'our-dates-v1'

const items = ref([])
const when = ref('')
const activity = ref('')

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) items.value = JSON.parse(raw)
  } catch (e) {
    items.value = []
  }
})

watch(
  items,
  (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
  { deep: true }
)

function add() {
  if (!when.value || !activity.value.trim()) return
  items.value.push({ id: Date.now(), when: when.value, activity: activity.value.trim(), done: false })
  when.value = ''
  activity.value = ''
}

function remove(id) {
  items.value = items.value.filter((i) => i.id !== id)
}

function toggle(item) {
  item.done = !item.done
}

function pick(s) {
  activity.value = s
}

const sorted = computed(() => [...items.value].sort((a, b) => new Date(a.when) - new Date(b.when)))

function fmt(dtStr) {
  const d = new Date(dtStr)
  if (isNaN(d)) return dtStr
  return d.toLocaleString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isPast = (dtStr) => new Date(dtStr) < new Date()
</script>

<template>
  <section class="sched">
    <p class="eyebrow">Планы</p>
    <ParticleText text="Когда ты свободна" height="clamp(46px, 8vw, 78px)" class="head" />

    <div class="form">
      <input v-model="when" type="datetime-local" class="field" />
      <input
        v-model="activity"
        type="text"
        class="field"
        placeholder="Чем займёмся"
        @keyup.enter="add"
      />
      <button class="pill add" @click="add">Добавить</button>
    </div>

    <div class="chips">
      <button v-for="s in ACTIVITY_SUGGESTIONS" :key="s" class="chip" @click="pick(s)">
        {{ s }}
      </button>
    </div>

    <transition-group name="list" tag="ul" class="list">
      <li
        v-for="item in sorted"
        :key="item.id"
        class="item"
        :class="{ done: item.done, past: isPast(item.when) && !item.done }"
      >
        <button
          class="dot"
          :class="{ on: item.done }"
          @click="toggle(item)"
          :aria-label="item.done ? 'Было' : 'Отметить'"
        ></button>
        <div class="info">
          <div class="act">{{ item.activity }}</div>
          <div class="dt">{{ fmt(item.when) }}</div>
        </div>
        <button class="ghost del" @click="remove(item.id)">Убрать</button>
      </li>
    </transition-group>

    <p v-if="!items.length" class="empty body-copy">Пока пусто. Добавь первое свидание.</p>
  </section>
</template>

<style scoped>
.sched {
  position: relative;
  z-index: 2;
  width: 100%;
  animation: riseIn 0.9s ease both;
}

.eyebrow {
  margin-bottom: 16px;
}

.head {
  font-size: clamp(28px, 6vw, 56px);
  font-weight: 400;
  letter-spacing: -0.03em;
  color: var(--white);
  margin-bottom: 40px;
}

.form {
  display: grid;
  grid-template-columns: 1fr 1.4fr auto;
  gap: 20px;
  align-items: end;
}

.field {
  background: none;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  padding: 12px 2px;
  color: var(--white);
  font-family: inherit;
  font-size: 17px;
  font-weight: 400;
  outline: none;
  transition: border-color 0.2s ease;
  color-scheme: dark;
  min-width: 0;
}
.field:focus {
  border-color: var(--iris);
}
.field::placeholder {
  color: var(--ash);
}

.add {
  white-space: nowrap;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}
.chip {
  background: none;
  border: none;
  color: var(--ash);
  font-family: inherit;
  font-size: 14px;
  padding: 6px 0;
  cursor: pointer;
  transition: color 0.16s ease;
}
.chip::after {
  content: '·';
  margin-left: 10px;
  color: rgba(255, 255, 255, 0.22);
}
.chip:last-child::after {
  content: '';
}
.chip:hover {
  color: var(--saffron);
}

.list {
  list-style: none;
  margin-top: 44px;
  display: flex;
  flex-direction: column;
}

.item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.item:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.item.done {
  opacity: 0.45;
}
.item.done .act {
  text-decoration: line-through;
}

.dot {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid var(--ash);
  background: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.18s ease;
}
.dot.on {
  background: var(--iris);
  border-color: var(--iris);
}
.item.past .dot {
  border-color: var(--saffron);
}

.info {
  flex: 1;
  min-width: 0;
}
.act {
  font-size: 20px;
  font-weight: 400;
  color: var(--white);
  word-break: break-word;
}
.dt {
  font-size: 14px;
  font-weight: 400;
  color: var(--ash);
  margin-top: 4px;
}

.del {
  flex-shrink: 0;
}

.empty {
  margin-top: 32px;
  font-size: 17px;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

@media (max-width: 620px) {
  .form {
    grid-template-columns: 1fr;
    gap: 22px;
  }
  .add {
    justify-self: start;
  }
}
</style>
