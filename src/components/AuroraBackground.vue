<template>
  <div class="aurora" aria-hidden="true">
    <div class="blob b1"></div>
    <div class="blob b2"></div>
    <div class="blob b3"></div>
    <div class="blob b4"></div>
  </div>
  <div class="grid-ov" aria-hidden="true"></div>
  <div class="scan" aria-hidden="true"></div>
</template>

<style scoped>
/* ---- 极光背景（04 配色）---- */
.aurora {
  position: fixed;
  inset: 0;
  z-index: -2;
  overflow: hidden;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
  animation: float 22s ease-in-out infinite;
}

.b1 {
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, #7c5cff, transparent 70%);
  top: -220px;
  left: -140px;
}
.b2 {
  width: 560px;
  height: 560px;
  background: radial-gradient(circle, #22d3ee, transparent 70%);
  top: 120px;
  right: -180px;
  animation-delay: -6s;
}
.b3 {
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, #f472b6, transparent 70%);
  top: 900px;
  left: -120px;
  animation-delay: -11s;
  opacity: 0.32;
}
.b4 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #34d399, transparent 70%);
  top: 1500px;
  right: -160px;
  animation-delay: -16s;
  opacity: 0.28;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(60px, -40px) scale(1.1);
  }
  66% {
    transform: translate(-50px, 50px) scale(0.94);
  }
}

/* ---- 网格遮罩 ---- */
.grid-ov {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.35;
  background-image: linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000, transparent 75%);
}

/* ---- 扫描线（01 终端质感，压到很淡）---- */
.scan {
  position: fixed;
  inset: 0;
  z-index: 99;
  pointer-events: none;
  opacity: 0.28;
  mix-blend-mode: overlay;
  background: repeating-linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0 2px,
    rgba(0, 0, 0, 0.22) 2px 3px
  );
}

@media (max-width: 640px) {
  .blob {
    filter: blur(70px);
    opacity: 0.38;
  }
  .scan {
    opacity: 0.18;
  }
}
</style>
