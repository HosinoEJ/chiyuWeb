<template>
  <div v-if="type === 'text'" :class="['banner', bannerType]" id="main-banner">
    <h1 class="title-lockup" :aria-label="cnText">
      <span class="title-stage">
        <span class="title-py" aria-hidden="true">
          <span
            v-for="(char, index) in pyChars"
            :key="`py-${index}`"
            :class="['py-char', { 'o-morph': char === 'o', 'is-dot': char === '·' }]"
            :style="{ '--i': String(index) }"
          >
            <template v-if="char === 'o'">
              <span class="o-glyph">o</span>
              <span class="o-capsule">
                <svg
                  v-for="(icon, iconIndex) in capsuleIcons"
                  :key="iconIndex"
                  class="o-icon"
                  :style="{ '--i': String(iconIndex) }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path v-for="(path, pathIndex) in icon" :key="pathIndex" :d="path" />
                </svg>
              </span>
            </template>
            <template v-else>{{ char }}</template>
          </span>
        </span>
        <span class="title-cn" aria-hidden="true">
          <span class="cn-prefix">
            <span
              v-for="(char, index) in prefixChars"
              :key="`prefix-${index}`"
              class="cn-char prefix-char"
              :style="{ '--i': String(prefixChars.length - 1 - index) }"
              >{{ char }}</span
            >
          </span>
          <span class="cn-brand">
            <span
              v-for="(char, index) in brandChars"
              :key="`brand-${index}`"
              class="cn-char brand-char"
              :style="{ '--i': String(index) }"
              >{{ char }}</span
            >
          </span>
        </span>
      </span>
    </h1>
    <div class="subtitle">
      <Transition name="fade" mode="out-in">
        <span :key="displayText" class="text" @click="toggleHitokoto">
          {{ displayText }}
        </span>
      </Transition>
    </div>
    <Transition name="fade" mode="out-in">
      <i v-if="height === 'full'" class="iconfont icon-up" @click="scrollToHome" />
    </Transition>
  </div>
  <div
    v-else-if="type === 'page'"
    :class="['banner-page', 's-card', { image }]"
    :style="{
      backgroundImage: image ? `url(${image})` : null,
    }"
  >
    <div class="top">
      <div class="title">
        <span class="title-small">{{ title }}</span>
        <span class="title-big">{{ desc }}</span>
      </div>
      <div class="top-right">
        <slot name="header-slot" />
      </div>
    </div>
    <slot />
    <div class="footer">
      <div class="footer-left">
        {{ footer }}
      </div>
      <div class="footer-right">
        <slot name="footer-slot" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { mainStore } from '@/store';
import { getHitokoto } from '@/api';

const store = mainStore();
const { theme } = useData();

// 首页标题的拼音：首屏先以它出现，结束前整行向左滑出。
// 之后「池鱼小栈」先单独落到画面中心，再由「你好，欢迎来到」从左侧撑开，
// 把这四个字推到欢迎语末尾的最终位置。
// 拼音与欢迎语都使用小赖字体（title-anim.woff2 为按需子集）。
// 动画的“o → 胶囊 → 图标轮播 → 还原”完全由 CSS 时间线驱动（见下方样式）。
const titlePinyin = "ChiYu·XiaoZhan";
const pyChars = titlePinyin.split("");
const cnPrefix = "你好，欢迎来到";
const prefixChars = cnPrefix.split("");
const cnBrand = computed(() => theme.value.siteMeta.title || "池鱼小栈");
const brandChars = computed(() => cnBrand.value.split(""));
const cnText = computed(() => `${cnPrefix}${cnBrand.value}`);

// 标题动画在 7.55s 结束（前缀 6.8s 开始逐字入场，最后一字 7.55s 落定），这里取 7.6s 留 50ms 定稿；
// 随机文案在动画结束后再等 3s 才开始。
const TITLE_ANIMATION_MS = 7600;
const HITOKOTO_DELAY_MS = TITLE_ANIMATION_MS + 3000;
const titleAnimationDone = ref(false);
let titleStartedAt = 0;
let titleDoneTimer = null;

// “o” 胶囊内轮播的图标，顺序对齐 WorkBuddy 首页标题：
// ∞ → 下载/波浪 → 公文包 → 公文包（勾） → </> → >_
const capsuleIcons = [
  [
    "M6.8 8.2c-2.1 0-3.8 1.7-3.8 3.8s1.7 3.8 3.8 3.8c4.4 0 7.2-7.6 11.6-7.6 2.1 0 3.8 1.7 3.8 3.8s-1.7 3.8-3.8 3.8c-4.4 0-7.2-7.6-11.6-7.6Z",
  ],
  [
    "M12 4.5v9.5",
    "m8.2 10.2 3.8 3.8 3.8-3.8",
    "M4.5 18.5c2 0 2.6-1.6 4.5-1.6s2.5 1.6 4.5 1.6 2.5-1.6 4.5-1.6 2 .6 2 .6",
  ],
  [
    "M3.5 8.5h17v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z",
    "M9 8.5V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5",
    "M3.5 13.5h17",
  ],
  [
    "M3.5 8.5h17v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z",
    "M9 8.5V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5",
    "m9.5 14 1.8 1.8 3.4-3.4",
  ],
  ["m8 7.5-4.5 4.5L8 16.5", "m16 7.5 4.5 4.5L16 16.5", "M13.6 4.8 10.4 19.2"],
  ["m4.5 7.5 4.5 4.5-4.5 4.5", "M12 16.5h7.5"],
];

const props = defineProps({
  type: { type: String, default: 'text' },
  height: { type: String, default: 'half' },
  title: { type: String, default: '这里是标题' },
  desc: { type: String, default: '这里是简介' },
  footer: { type: String, default: '' },
  image: { type: String, default: '' },
});

// 存储一言数据和状态
const hitokotoData = ref({ hitokoto: '', from: '', from_who: '' });
const isHitokotoDisplayed = ref(false);
const isManualSloganDisplayed = ref(false);

// 自动轮询相关
const hitokotoInitialTimeout = ref(null);
const manualSloganTimeout = ref(null);
const autoSwitchInterval = ref(null);
const autoSwitchActive = ref(false);
// 并发请求令牌：慢请求回来后不能覆盖后发出的请求
let hitokotoRequestId = 0;

// 是否已经手动点击过一次，停止自动并锁定手动模式
const disableAuto = ref(false);

// 默认标语
const defaultSlogan = theme.value.siteMeta.description;
const manualSlogan = '所以，回去吧，回到我们，所有「奇迹」开始的地方';

// 计算展示的文字：若当前为“一言”状态则显示一言，否则显示默认标语
const displayText = computed(() =>
  isHitokotoDisplayed.value && hitokotoData.value.hitokoto
    ? hitokotoData.value.hitokoto
    : isManualSloganDisplayed.value
      ? manualSlogan
      : defaultSlogan
);

// 点击处理：
// 每次人工点击都会暂停自动轮播；最后一次点击 3 秒后恢复。
// 标题动画播放期间不响应点击，保证下方文案完全不动。
async function toggleHitokoto() {
  if (!titleAnimationDone.value) return;

  const isFirstManualInteraction = !disableAuto.value;

  pauseHitokotoCycle();
  disableAuto.value = true;

  if (isFirstManualInteraction) {
    // 首次人工介入时显示手动标语。
    isHitokotoDisplayed.value = false;
    isManualSloganDisplayed.value = true;
  } else {
    // 后续点击仍可手动获取新一言。
    await fetchAndShowHitokoto();
  }

  manualSloganTimeout.value = setTimeout(resumeHitokotoCycle, 3000);
}

// 只请求并缓存，不改变当前展示内容（动画期间先缓存一句）
async function fetchHitokoto() {
  const requestId = ++hitokotoRequestId;
  try {
    const result = await getHitokoto();
    // 期间若有更新的请求发出，丢弃这次结果
    if (requestId !== hitokotoRequestId) return false;
    hitokotoData.value = {
      hitokoto: result.hitokoto,
      from: result.from,
      from_who: result.from_who
    };
    return true;
  } catch (err) {
    console.error('一言获取失败：', err);
    return false;
  }
}

// 请求并立即展示
async function fetchAndShowHitokoto() {
  const success = await fetchHitokoto();
  if (!success) return;
  isHitokotoDisplayed.value = true;
  isManualSloganDisplayed.value = false;
}

// 自动轮询执行
async function autoToggleHitokoto() {
  await fetchAndShowHitokoto();
}

// 启动首次延迟 + 后续自动轮询。
// 首次延迟 = 标题动画时长 + 3s；动画结束后仍有 3s 让定稿画面停留。
function startHitokotoCycle() {
  if (disableAuto.value) return;
  const elapsed = titleStartedAt ? Date.now() - titleStartedAt : 0;
  const delay = Math.max(HITOKOTO_DELAY_MS - elapsed, 0);
  hitokotoInitialTimeout.value = setTimeout(async () => {
    if (hitokotoData.value.hitokoto) {
      // 使用动画期间缓存好的那一句，避免首屏再等一次请求。
      isHitokotoDisplayed.value = true;
      isManualSloganDisplayed.value = false;
    } else {
      await fetchAndShowHitokoto();
    }
    autoSwitchInterval.value = setInterval(autoToggleHitokoto, 7000);
    autoSwitchActive.value = true;
  }, delay);
}

// 手动标语停留 3 秒后，恢复正常的一言轮播。
async function resumeHitokotoCycle() {
  manualSloganTimeout.value = null;
  disableAuto.value = false;
  await fetchAndShowHitokoto();
  if (!disableAuto.value && !autoSwitchInterval.value) {
    autoSwitchInterval.value = setInterval(autoToggleHitokoto, 7000);
    autoSwitchActive.value = true;
  }
}

function clearManualSloganTimeout() {
  if (manualSloganTimeout.value) {
    clearTimeout(manualSloganTimeout.value);
    manualSloganTimeout.value = null;
  }
}

// 暂停所有定时/请求
function pauseHitokotoCycle() {
  clearManualSloganTimeout();
  if (hitokotoInitialTimeout.value) {
    clearTimeout(hitokotoInitialTimeout.value);
    hitokotoInitialTimeout.value = null;
  }
  if (autoSwitchInterval.value) {
    clearInterval(autoSwitchInterval.value);
    autoSwitchInterval.value = null;
  }
  autoSwitchActive.value = false;
}

// Page Visibility API：切换标签页时暂停，切回时（若未手动禁用）恢复
function handleVisibilityChange() {
  if (document.hidden) {
    pauseHitokotoCycle();
  } else if (!disableAuto.value && !autoSwitchActive.value && !hitokotoInitialTimeout.value) {
    startHitokotoCycle();
  }
}

// 滚动至首页
function scrollToHome() {
  const bannerDom = document.getElementById('main-banner');
  if (!bannerDom) return;
  scrollTo({ top: bannerDom.offsetHeight, behavior: 'smooth' });
}

// 同步外部 store 的 bannerType
const bannerType = ref(store.bannerType);
watch(() => store.bannerType, val => (bannerType.value = val));

onMounted(() => {
  if (props.type === 'text') {
    // 动画期间只缓存一句，不切换下方文案
    titleStartedAt = Date.now();
    fetchHitokoto();
    titleDoneTimer = setTimeout(() => {
      titleAnimationDone.value = true;
    }, TITLE_ANIMATION_MS);
    startHitokotoCycle();
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
});

onBeforeUnmount(() => {
  pauseHitokotoCycle();
  if (titleDoneTimer) {
    clearTimeout(titleDoneTimer);
    titleDoneTimer = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
.banner {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fade-up 0.6s 0.1s backwards;
  transition: height 0.3s;
  &.full {
    opacity: 0;
    height: calc(100vh - 70px);
    padding-bottom: 100px;
    animation: fade-up 0.6s 0.5s forwards;
    .subtitle {
      opacity: 0;
      animation: fade-up-opacity 0.8s 0.5s forwards;
    }
  }
  .title-lockup {
    --title-timeline: 7.2s;
    --py-size: min(3.7rem, 7.8vw);
    --cn-size: min(2.9rem, 6.6vw);
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin: 0;
    color: var(--main-font-color);
    font-weight: 400;
    line-height: 1;
    text-align: center;
    user-select: none;
  }
  .title-stage {
    position: relative;
    display: grid;
    place-items: center;
    width: 15em;
    max-width: 100%;
    overflow: hidden;
    clip-path: inset(-0.4em 0);
    font-size: var(--cn-size);
  }
  .title-py {
    grid-area: 1 / 1;
    display: flex;
    align-items: baseline;
    justify-content: center;
    font-family: "Title Xiaolai", "Site Title", var(--main-font-family);
    font-size: var(--py-size);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
    white-space: nowrap;
    transform: translateX(-180%);
    animation: py-exit var(--title-timeline) cubic-bezier(0.55, 0, 0.85, 0.36) both;

    .py-char {
      position: relative;
      display: inline-block;
      line-height: 1;
      animation: py-char-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--i) * 0.04s);

      &.is-dot {
        width: 0.85em;
        color: var(--main-font-second-color);
        text-align: center;
      }

      &.o-morph {
        width: 0.58em;
        text-align: center;
        will-change: width;
        animation:
          py-char-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--i) * 0.04s) both,
          o-morph var(--title-timeline) cubic-bezier(0.16, 1, 0.3, 1) both;
      }
    }

    .o-glyph {
      display: inline-block;
      line-height: 1;
      animation: glyph-hide var(--title-timeline) linear both;
    }

    .o-capsule {
      position: absolute;
      top: 53%;
      right: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 0.76em;
      border-radius: 999px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0) 45%),
        linear-gradient(120deg, #a7f3e4 0%, #5eead4 45%, #2dd4bf 100%);
      box-shadow:
        0 0.08em 0.22em rgba(45, 212, 191, 0.26),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-50%) scaleY(0.55);
      animation:
        capsule-in var(--title-timeline) cubic-bezier(0.16, 1, 0.3, 1) both,
        capsule-hue 4.4s ease-in-out 1.3s both;
      will-change: opacity, transform, filter;

      .o-icon {
        position: absolute;
        inset: 0;
        width: 0.66em;
        height: 0.66em;
        margin: auto;
        color: #fff;
        opacity: 0;
        transform: scale(0.4) rotate(-12deg);
        animation: icon-pop 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        animation-delay: calc(1.32s + var(--i) * 0.64s);
      }
    }
  }
  .title-cn {
    grid-area: 1 / 1;
    display: flex;
    justify-content: center;
    font-family: "Title Xiaolai", "Site Title", var(--main-font-family);
    font-size: var(--cn-size);
    font-weight: 700;
    line-height: 1.24;
    white-space: nowrap;

    // 7em = 前缀 7 个字；宽度从 0 撑到 7em 时把右侧品牌推到最终位置
    .cn-prefix {
      display: flex;
      flex: none;
      justify-content: flex-end;
      width: 7em;
      overflow: hidden;
      animation: prefix-push 0.55s linear 6.8s both;
    }

    .cn-brand {
      display: flex;
      flex: none;
      transform-origin: center;
      animation: brand-scale 1.35s cubic-bezier(0.16, 1, 0.3, 1) 6s both;
      will-change: transform;
    }

    .cn-char {
      display: inline-block;
      white-space: pre;
    }

    .prefix-char {
      flex: none;
      animation: prefix-char-in 0.26s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(6.82s + var(--i) * 0.078s);
    }

    .brand-char {
      flex: none;
      animation: brand-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(6s + var(--i) * 0.04s);
    }
  }
  .subtitle {
    width: 80%;
    margin-top: 0.9rem;
    font-size: 1.25rem;
    opacity: 0.8;
    animation: fade-up-opacity 0.6s 0.1s backwards;
  .text {
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; // WebKit 引擎兼容性
    -webkit-box-orient: vertical; // WebKit 引擎兼容性

    line-clamp: 2; // 标准的 line-clamp 属性，提高兼容性
  }
}
  .icon-up {
    font-size: 20px;
    position: absolute;
    bottom: 60px;
    left: calc(50% - 10px);
    transform: rotate(180deg);
    animation: moveDown 2s ease-in-out infinite;
    cursor: pointer;
  }
  @media (max-width: 768px) {
    align-items: flex-start;
    height: 240px;
    .title-lockup {
      --cn-size: 2.4rem;
    }
    .subtitle {
      height: 50px;
      font-size: 1.125rem;
      margin-left: 8px;
      .text {
        text-align: left;
      }
    }
  }
  @media (max-width: 480px) {
    .title-lockup {
      --cn-size: 1.6rem;
    }
  }
  @media (max-width: 360px) {
    .title-lockup {
      --cn-size: 1.45rem;
    }
  }
}
.banner-page {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  min-height: 380px;
  background-size: cover;
  .top {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    .title {
      display: flex;
      flex-direction: column;
      .title-small {
        color: var(--main-font-second-color);
        font-size: 0.875rem;
      }
      .title-big {
        font-size: 2.25rem;
        font-weight: bold;
        line-height: 1.2;
        margin-top: 12px;
      }
    }
  }
  .footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    .footer-left {
      margin-top: auto;
      color: var(--main-font-second-color);
      opacity: 0.8;
    }
  }
  &.image {
    color: #fff !important;
    .top {
      .title-small {
        color: #fff;
        opacity: 0.6;
      }
    }
    .footer {
      .footer-left {
        color: #fff;
      }
      :deep(.iconfont) {
        color: #fff !important;
      }
    }
  }
  @media (max-width: 1200px) {
    min-height: 300px;
  }
  @media (max-width: 768px) {
    min-height: 260px;
    .top-right,
    .footer-right {
      display: none;
    }
  }
}

/*
 * 首页标题动画（逐帧对照 workbuddy.cn 的 hero-title WebP）：
 * 0.0-1.2s   拼音逐字浮入
 * 1.09-1.70s 字母 o 撑成薄荷胶囊
 * 1.32-5.12s 胶囊内轮播 6 个图标
 * 5.26-5.62s 胶囊收窄、还原成 o
 * 5.62-6.01s 整行拼音向左滑出画面
 * 6.00-6.54s 「池鱼小栈」以 Logo 形态放大落到画面中心
 * 6.80-7.35s 「你好，欢迎来到」贴着「池鱼小栈」从右往左逐字落下
 * 6.80-7.35s 品牌一边平滑缩小一边往右平移
 * 6.82-7.55s 七个字从右到左依次落下
 * 最终状态即基础样式：无 JS / prefers-reduced-motion 时直接呈现欢迎语。
 */
@keyframes py-char-in {
  0% {
    opacity: 0;
    filter: blur(7px);
    transform: translateY(0.5em) rotate(3deg);
  }
  100% {
    opacity: 1;
    filter: none;
    transform: translateY(0) rotate(0deg);
  }
}

@keyframes py-exit {
  0%,
  78% {
    transform: translateX(0);
  }
  83.5%,
  100% {
    transform: translateX(-180%);
  }
}

@keyframes o-morph {
  0%,
  16% {
    width: 0.58em;
  }
  25%,
  73% {
    width: 1.6em;
  }
  78%,
  100% {
    width: 0.58em;
  }
}

@keyframes capsule-in {
  0%,
  15% {
    opacity: 0;
    transform: translateY(-50%) scaleY(0.55);
  }
  18%,
  74% {
    opacity: 1;
    transform: translateY(-50%) scaleY(1);
  }
  78%,
  100% {
    opacity: 0;
    transform: translateY(-50%) scaleY(0.55);
  }
}

@keyframes glyph-hide {
  0%,
  12% {
    opacity: 1;
  }
  15.5%,
  73.5% {
    opacity: 0;
  }
  78%,
  100% {
    opacity: 1;
  }
}

@keyframes capsule-hue {
  0% {
    filter: hue-rotate(0deg);
  }
  40% {
    filter: hue-rotate(20deg);
  }
  72% {
    filter: hue-rotate(52deg);
  }
  100% {
    filter: hue-rotate(0deg);
  }
}

@keyframes icon-pop {
  0% {
    opacity: 0;
    transform: scale(0.4) rotate(-12deg);
  }
  16%,
  84% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.85) rotate(6deg);
  }
}

@keyframes brand-in {
  0% {
    opacity: 0;
    filter: blur(6px);
    transform: translateY(0.42em);
  }
  100% {
    opacity: 1;
    filter: none;
    transform: translateY(0);
  }
}

@keyframes brand-scale {
  0%,
  59% {
    transform: scale(1.55);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes prefix-char-in {
  0% {
    opacity: 0;
    filter: blur(5px);
    transform: translateY(-0.38em);
  }
  100% {
    opacity: 1;
    filter: none;
    transform: translateY(0);
  }
}

@keyframes prefix-push {
  0% {
    width: 0;
  }
  100% {
    width: 7em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .title-py,
  .title-py .py-char,
  .title-py .o-morph,
  .title-py .o-glyph,
  .title-py .o-capsule,
  .title-py .o-icon,
  .cn-prefix,
  .cn-brand,
  .prefix-char,
  .brand-char {
    animation: none;
  }
}
</style>
