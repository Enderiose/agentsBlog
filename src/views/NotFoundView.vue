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
  padding: 48px 40px;
  text-align: center;
  max-width: 520px;
  width: 100%;
}

.code {
  font-size: 64px;
  letter-spacing: -4px;
  line-height: 1;
  background: linear-gradient(120deg, #c4b5fd, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 18px;
}

.cmd {
  font-size: 12.5px;
  color: var(--ink-4);
  margin-bottom: 22px;
}
.cmd .p {
  color: var(--prompt);
}
.cmd .err {
  color: var(--amber);
}

h2 {
  font-size: 19px;
  margin: 0 0 26px;
  letter-spacing: -0.4px;
}

.row {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
