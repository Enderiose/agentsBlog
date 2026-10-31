<template>
  <div class="wrap nf">
    <div class="glass box">
      <div class="code">404</div>
      <div class="cmd"><span class="p">~/agents</span> $ cat ./这个路径 <span class="err">✗ no such file</span></div>
      <h2>页面不存在</h2>
      <div class="row">
        <RouterLink class="btn btn-primary" to="/">回到首页</RouterLink>
        <RouterLink class="btn" to="/posts">全部记录</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nf {
  padding: 100px 24px;
  display: grid;
  place-items: center;
}

.box {
  padding: 44px 38px;
  text-align: center;
  max-width: 520px;
  width: 100%;
  background: var(--note-y);
}

.code {
  font-size: 68px;
  letter-spacing: 3px;
  line-height: 1;
  color: var(--pen-red);
  margin-bottom: 16px;
  font-family: var(--mono);
  transform: rotate(-2deg);
}

.cmd {
  font-size: 14px;
  color: var(--ink-3);
  margin-bottom: 20px;
  font-family: var(--mono);
}
.cmd .p {
  color: var(--pen-red);
}
.cmd .err {
  color: var(--amber);
}

h2 {
  font-size: 22px;
  margin: 0 0 24px;
  letter-spacing: 0.4px;
  font-weight: 400;
}

.row {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
