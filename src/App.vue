<script setup>
import { ref } from 'vue'
import CosmicBackground from './components/CosmicBackground.vue'
import InviteGate from './components/InviteGate.vue'
import LoveTimer from './components/LoveTimer.vue'
import Scheduler from './components/Scheduler.vue'
import ParticleText from './components/ParticleText.vue'
import { START_DATE } from './config.js'

const entered = ref(false)
const sinceLabel = START_DATE.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
</script>

<template>
  <CosmicBackground />

  <InviteGate v-if="!entered" @accepted="entered = true" />

  <div v-else class="page">
    <nav class="nav">
      <div class="brand">
        <span class="mark"></span>
        <span class="word">нас двое</span>
      </div>
      <span class="since">с {{ sinceLabel }}</span>
    </nav>

    <main class="main">
      <section class="hero">
        <ParticleText text="15-го я зафиналил" height="clamp(70px, 12vw, 150px)" />
      </section>

      <LoveTimer />
      <Scheduler />
    </main>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.nav {
  position: relative;
  z-index: 3;
  max-width: 1120px;
  margin: 0 auto;
  padding: 26px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mark {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 14px solid var(--iris);
  display: inline-block;
}
.word {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--white);
}
.since {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ash);
}

.main {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(48px, 10vw, 120px) 24px 120px;
  display: flex;
  flex-direction: column;
  gap: clamp(72px, 12vw, 120px);
}

.hero {
  animation: riseIn 0.6s ease both;
}
.title {
  font-size: clamp(48px, 12vw, 113px);
  color: var(--white);
  margin-top: 20px;
  max-width: 12ch;
}
</style>
