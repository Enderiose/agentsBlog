<script setup lang="ts">
/* 手账背景：打孔装订 + 纸纤维 + 右侧索引标签 */
</script>

<template>
  <div class="paper" aria-hidden="true">
    <div class="binding">
      <i v-for="n in 26" :key="n" />
    </div>
    <div class="grain" />
    <div class="dogear" />
  </div>
</template>

<style scoped>
.paper {
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  overflow: hidden;
}

/* 左侧螺旋装订：一排打孔 */
.binding {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 18px 0;
  background: linear-gradient(
    90deg,
    var(--binding-1),
    var(--binding-2)
  );
  border-right: 1px dashed var(--binding-edge);
}

.binding i {
  width: 11px;
  height: 11px;
  margin: 0 auto;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    var(--hole-in),
    var(--hole-mid) 70%,
    var(--hole-out)
  );
  box-shadow: inset 0 0 0 1px var(--hole-ring), 1px 1px 2px var(--hole-shadow);
}

/* 纸纤维噪点 */
.grain {
  position: absolute;
  inset: 0;
  opacity: var(--grain-opacity);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

/* 右上角折角 */
.dogear {
  position: absolute;
  top: 0;
  right: 0;
  width: 26px;
  height: 26px;
  background: linear-gradient(225deg, var(--paper-2) 0 50%, transparent 50%);
  opacity: 0.9;
}

@media (max-width: 900px) {
  .binding,
  .dogear {
    display: none;
  }
}
</style>
