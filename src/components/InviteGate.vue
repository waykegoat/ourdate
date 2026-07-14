<script setup>
import { reactive, ref } from 'vue'
import { INVITE } from '../config.js'
import ParticleText from './ParticleText.vue'

const emit = defineEmits(['accepted'])

const noStyle = reactive({ transform: 'translate(0px, 0px)' })
const accepted = ref(false)

// Кнопка «Нет» убегает от курсора / пальца
function dodge() {
  const range = Math.min(window.innerWidth, window.innerHeight) * 0.34
  const x = (Math.random() * 2 - 1) * range
  const y = (Math.random() * 2 - 1) * range
  noStyle.transform = `translate(${x}px, ${y}px)`
}

function onYes() {
  accepted.value = true
  setTimeout(() => emit('accepted'), 1200)
}
</script>

<template>
  <div class="gate">
    <transition name="fade" mode="out-in">
      <div v-if="!accepted" key="ask" class="wrap">
        <ParticleText :text="INVITE.question" clickable class="ptitle" @activate="onYes" />
        <p class="body-copy sub">{{ INVITE.subtext }}</p>

        <div class="btns">
          <button class="pill" @click="onYes">{{ INVITE.yes }}</button>
          <button
            class="no"
            :style="noStyle"
            @mouseenter="dodge"
            @mousedown.prevent="dodge"
            @touchstart.prevent="dodge"
            @click.prevent="dodge"
          >
            {{ INVITE.no }}
          </button>
        </div>
      </div>

      <div v-else key="ok" class="wrap">
        <h1 class="display q accepted">{{ INVITE.accepted }}</h1>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.gate {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 24px clamp(24px, 8vw, 120px);
}

.wrap {
  max-width: 560px;
  width: 100%;
  text-align: left;
  animation: riseIn 0.7s ease both;
}

/* На узких экранах констелляция тусклая — текст поверх центра */
@media (max-width: 760px) {
  .gate {
    justify-content: center;
    padding: 24px;
  }
}

.eyebrow {
  margin-bottom: 20px;
}

.q {
  font-size: clamp(56px, 13vw, 113px);
  color: var(--white);
}

.sub {
  font-size: clamp(17px, 2.4vw, 20px);
  margin-top: 22px;
  max-width: 440px;
}

.btns {
  display: flex;
  gap: 26px;
  align-items: center;
  margin-top: 44px;
  min-height: 56px;
}

.no {
  background: none;
  border: none;
  color: var(--ash);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 15px 20px;
  transition: transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1), color 0.16s ease;
  will-change: transform;
}
.no:hover {
  color: var(--silver);
}

.accepted {
  font-size: clamp(44px, 10vw, 96px);
  color: var(--white);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
