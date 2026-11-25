// HTML-шаблоны: <head>, шапка, подвал, страницы услуг, 404 и генерируемые блоки главной.
import { SITE, abs } from './config.mjs';
import { jsonLdScript } from './jsonld.mjs';
import { LEGAL_PAGES } from './legal.mjs';

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Неразрывные пробелы после коротких слов и перед тире — как в остальной вёрстке сайта */
export function typo(s) {
  return esc(s)
    .replace(/(^|[\s(«])(в|и|к|с|у|о|а|на|не|ни|по|за|до|от|из|для|без|при|про|что|как|или|но|мы|вы|их|же|ли|бы|во|со|об)\s/gi, '$1$2&nbsp;')
    .replace(/(^|[\s(«])(в|и|к|с|у|о|а|на|не|по|за|до|от|из)\s/gi, '$1$2&nbsp;') // второй проход для «и в»
    .replace(/\s—\s/g, '&nbsp;— ');
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const ruDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

export const servicePath = (s) => `/uslugi/${s.slug}/`;

// Корень сайта на сервере: '/' для своего домена, '/vecode-site/' для GitHub Pages без домена
export const BASE = new URL(`${SITE.url}/`).pathname;

/* ---------------- <head> ---------------- */
export function head({ title, description, path, rel = '', robots = 'index, follow', jsonld, absoluteAssets = false }) {
  const a = absoluteAssets ? BASE : rel; // для 404 — пути от корня сайта, т.к. она отдаётся по любому адресу
  const url = path ? abs(path) : null;
  const img = abs(SITE.ogImage.path);
  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${robots === 'index, follow' ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : robots}">
  ${url ? `<link rel="canonical" href="${url}">` : ''}
  <meta name="theme-color" content="${SITE.themeColor}">
  <meta name="format-detection" content="telephone=no">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(SITE.name)}">
  <meta property="og:locale" content="${SITE.locale}">
  ${url ? `<meta property="og:url" content="${url}">` : ''}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${img}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="${SITE.ogImage.width}">
  <meta property="og:image:height" content="${SITE.ogImage.height}">
  <meta property="og:image:alt" content="${esc(SITE.ogImage.alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${img}">
  <meta name="twitter:image:alt" content="${esc(SITE.ogImage.alt)}">
  <link rel="icon" href="${a}assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="${a}assets/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="${a}assets/apple-touch-icon.png">
  <link rel="preload" href="${a}assets/fonts/manrope-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${a}css/style.css">
  <script>${PRELOAD_BOOT}</script>
  ${jsonld ? jsonLdScript(jsonld) : ''}
`;
}

/* ---------------- экран загрузки ---------------- */
// Показывается один раз за сессию браузера (~1,6 с). Без JS и при «уменьшить движение» — не показывается.
// Страховка: если основной скрипт не загрузился, экран снимается сам через 6 секунд.
const PRELOAD_BOOT =
  "(function(d){d.classList.add('js');try{if(!sessionStorage.getItem('vc-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){" +
  "d.classList.add('is-preloading');setTimeout(function(){d.classList.remove('is-preloading')},6000)}}catch(e){}})(document.documentElement);";

const preloader = () => `
<div class="preloader" aria-hidden="true">
  <div class="preloader__row">
    <span>${esc(SITE.name)} — студия разработки</span>
    <span class="preloader__tags">Веб · AI · CRM · Боты</span>
    <span>${new Date().getFullYear()}</span>
  </div>
  <div class="preloader__brand">
    <span class="preloader__word">${[...SITE.wordmark].map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join('')}</span>
    <span class="preloader__dot"></span>
  </div>
  <div class="preloader__row preloader__row--bottom">
    <span class="preloader__status"><span class="preloader__pulse"></span><span data-preload-status>Собираем интерфейс</span></span>
    <span class="preloader__count"><span data-preload-count>000</span><small>%</small></span>
  </div>
  <div class="preloader__bar"><span data-preload-bar></span></div>
</div>`;

/* ---------------- шапка и меню ---------------- */
// rel — относительный путь до корня сайта ('' на главной, '../' в /uslugi/, '../../' на странице услуги)
export function header(rel, { home = false } = {}) {
  const r = rel || '';
  const homeHref = home ? '#top' : r || './';
  return `${preloader()}
<header class="header" id="top">
  <div class="container header__inner">
    <a class="logo" href="${homeHref}" aria-label="${esc(SITE.name)} — на главную">
      <svg class="logo__mark" aria-hidden="true"><use href="#i-logo"/></svg>
      <span class="logo__text">${esc(SITE.wordmark)}</span>
    </a>
    <nav class="nav" aria-label="Основная навигация">
      <a href="${r}uslugi/">Услуги</a>
      <a href="${r}#work">Проекты</a>
      <a href="${r}#process">Процесс</a>
      <a href="${r}#faq">Вопросы</a>
      <a href="${r}#contact">Контакты</a>
    </nav>
    <div class="header__actions">
      <a class="header__tender" href="${r}tender/">Пригласить в&nbsp;тендер</a>
    </div>
    <button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="menu">
      <span></span><span></span>
    </button>
  </div>
</header>

<!-- Мобильное меню -->
<div class="menu" id="menu" hidden>
  <nav class="menu__nav" aria-label="Мобильная навигация">
    <a href="${r}uslugi/"><span>01</span>Услуги</a>
    <a href="${r}#work"><span>02</span>Проекты</a>
    <a href="${r}#process"><span>03</span>Процесс</a>
    <a href="${r}#faq"><span>04</span>Вопросы</a>
    <a href="${r}#contact"><span>05</span>Контакты</a>
  </nav>
  <div class="menu__actions">
    <a class="btn btn--accent" href="${r}#contact">Обсудить проект
      <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>
    </a>
    <a class="btn btn--line" href="${r}tender/">Пригласить в&nbsp;тендер</a>
  </div>
</div>
`;
}

export const SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 15 15 5M7 5h8v8"/>
  </symbol>
  <symbol id="i-logo" viewBox="0 0 28 28" fill="none">
    <path d="M5 8.5 14 23 21 11.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="22.5" cy="7.5" r="4.2" fill="#1A8754"/>
  </symbol>
</svg>`;

/* ---------------- подвал ---------------- */
export function footer(rel, services, { home = false, updated = SITE.updated } = {}) {
  const r = rel || '';
  const top = home ? '#top' : '#top';
  return `
<footer class="footer is-dark">
  <div class="container">
    <div class="footer__head">
      <a class="logo" href="${home ? '#top' : r || './'}" aria-label="${esc(SITE.name)} — ${home ? 'наверх' : 'на главную'}">
        <svg class="logo__mark" aria-hidden="true"><use href="#i-logo"/></svg>
        <span class="logo__text">${esc(SITE.wordmark)}</span>
      </a>
      <p class="footer__tagline">${typo(SITE.tagline)}</p>
      <nav class="footer__links" aria-label="Быстрые ссылки">
        <a href="${r}tender/">Пригласить в&nbsp;тендер <span aria-hidden="true">↗</span></a>
        <a href="${r}#contact">Оставить заявку <span aria-hidden="true">↗</span></a>
        ${SITE.telegram ? `<a href="${esc(SITE.telegram)}" rel="noopener">Telegram <span aria-hidden="true">↗</span></a>` : ''}
      </nav>
    </div>

    <div class="footer__cols">
      <nav class="footer__col" aria-label="Компания">
        <p class="footer__label">Компания</p>
        <a href="${r}#principles">О студии</a>
        <a href="${r}#process">Как мы работаем</a>
        <a href="${r}#faq">Вопросы и ответы</a>
      </nav>
      <nav class="footer__col" aria-label="Проекты">
        <p class="footer__label">Проекты</p>
        <a href="${r}#work">Портфолио</a>
        <a href="${r}uslugi/">Услуги</a>
        <a href="${r}#contact">Заполнить бриф</a>
        <a href="${r}tender/">Пригласить в&nbsp;тендер</a>
      </nav>
      <div class="footer__col">
        <p class="footer__label">Связаться</p>
        ${SITE.email ? `<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>` : '<!-- TODO: рабочая почта (SITE.email в tools/seo/config.mjs) -->'}
        ${SITE.phone ? `<a href="tel:${esc(SITE.phone.replace(/[^+\d]/g, ''))}">${esc(SITE.phone)}</a>` : ''}
        ${SITE.telegram ? `<a href="${esc(SITE.telegram)}" rel="noopener">Telegram</a>` : ''}
        <a href="${r}#contact">Оставить заявку</a>
      </div>
    </div>

    <p class="footer__word" aria-hidden="true">${esc(SITE.wordmark)}</p>

    <div class="footer__legal">
      <p>© <span id="year">${updated.slice(0, 4)}</span> ${esc(SITE.name)}</p>
      <nav class="footer__docs" aria-label="Документы">
        ${LEGAL_PAGES.map((d) => `<a href="${r}${d.slug}/">${esc(d.nav)}</a>`).join('\n        ')}
        <button type="button" class="footer__cookie" data-cookie-settings>Настройки cookie</button>
      </nav>
      <a class="footer__up" href="${top}">Наверх ↑</a>
    </div>
    ${SITE.legal.operator ? `<p class="footer__requisites">${esc(SITE.legal.operator)}${SITE.legal.inn ? `, ИНН ${esc(SITE.legal.inn)}` : ''}${SITE.legal.ogrn ? `, ОГРН ${esc(SITE.legal.ogrn)}` : ''}</p>` : '<!-- TODO: реквизиты оператора (SITE.legal в tools/seo/config.mjs) -->'}
  </div>
</footer>

<div class="cookie" id="cookie-banner" role="region" aria-label="Уведомление об использовании cookie" hidden>
  <p class="cookie__text">${typo('Мы используем cookie: необходимые — для работы сайта, аналитические — только с вашего согласия.')} Подробнее — в&nbsp;<a href="${r}cookie-policy/">Политике cookie</a> и&nbsp;<a href="${r}privacy/">Политике конфиденциальности</a>.</p>
  <div class="cookie__actions">
    <button type="button" class="cookie__btn cookie__btn--accent" data-cookie="all">Принять все</button>
    <button type="button" class="cookie__btn" data-cookie="necessary">Только необходимые</button>
  </div>
</div>
`;
}

/* ---------------- блоки ---------------- */
function crumbs(items) {
  return `<nav class="crumbs" aria-label="Хлебные крошки"><ol>
      ${items.map((it, i) => (i < items.length - 1 ? `<li><a href="${it.href}">${esc(it.name)}</a></li>` : `<li aria-current="page">${esc(it.name)}</li>`)).join('\n      ')}
    </ol></nav>`;
}

function faqBlock(faq, { title = 'Частые <em>вопросы</em>.', note = '', idPrefix = 'faq' } = {}) {
  return `
  <section class="section" id="faq">
    <div class="container faq">
      <div class="faq__head">
        <h2 class="section__title" data-reveal>${title}</h2>
        ${note ? `<p class="section__note" data-reveal>${note}</p>` : ''}
      </div>
      <div class="acc acc--dark" data-accordion>
${faqItems(faq, idPrefix)}
      </div>
    </div>
  </section>`;
}

export function faqItems(faq, idPrefix = 'faq') {
  return faq
    .map(
      ([q, a], i) => `        <div class="acc__item${i === 0 ? ' is-open' : ''}">
          <button class="acc__head" type="button" aria-expanded="${i === 0}" aria-controls="${idPrefix}-${i + 1}">
            <span class="acc__title">${typo(q)}</span>
            <span class="acc__toggle" aria-hidden="true"></span>
          </button>
          <div class="acc__body" id="${idPrefix}-${i + 1}"><div class="acc__inner">
            <p class="faq__text">${typo(a)}</p>
          </div></div>
        </div>`
    )
    .join('\n\n');
}

export function homeServices(services) {
  return services
    .map(
      (s, i) => `        <div class="acc__item${i === 0 ? ' is-open' : ''}">
          <button class="acc__head" type="button" aria-expanded="${i === 0}" aria-controls="srv-${i + 1}">
            <span class="acc__num">${String(i + 1).padStart(2, '0')}</span>
            <span class="acc__title">${typo(s.name)}</span>
            <span class="acc__toggle" aria-hidden="true"></span>
          </button>
          <div class="acc__body" id="srv-${i + 1}">
            <div class="acc__inner">
              <div class="srv">
                <p class="srv__text">${typo(s.short)}</p>
                <p class="srv__stack">${s.stack.map(esc).join(' / ')}</p>
                <div class="srv__links">
                  <a class="link" href="uslugi/${s.slug}/">${typo(s.name)}: сроки, стоимость, процесс <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
                  <a class="link link--muted" href="#contact">Обсудить задачу</a>
                </div>
              </div>
            </div>
          </div>
        </div>`
    )
    .join('\n\n');
}

export function formChips(services) {
  return [...services.map((s) => s.chip), 'Другое']
    .map((c) => `          <label><input type="checkbox" name="type" value="${esc(c)}"><span>${typo(c)}</span></label>`)
    .join('\n');
}

function cta(rel) {
  return `
  <section class="panel panel--cta is-dark">
    <div class="container cta">
      <div>
        <h2 class="cta__title">Обсудим ваш проект<em>?</em></h2>
        <p class="cta__text">${typo('Расскажите о задаче — в течение рабочего дня вернёмся с вопросами и предложим время для знакомства. Оценка по этапам — бесплатно.')}</p>
      </div>
      <div class="cta__actions">
        <a class="btn btn--accent" href="${rel}#contact">Оставить заявку <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
        <a class="btn btn--line" href="${rel}tender/">Пригласить в&nbsp;тендер</a>
      </div>
    </div>
  </section>`;
}

function page({ headHtml, rel, services, body, updated }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>${headHtml}</head>
<body>
${SPRITE}

<a class="skip" href="#main">К содержимому</a>
${header(rel)}
<main id="main">
${body}
</main>
${footer(rel, services, { updated })}
<script src="${rel}js/main.js" defer></script>
</body>
</html>
`;
}

/* ---------------- страница услуги ---------------- */
export function servicePage({ s, services, headHtml, updated }) {
  const rel = '../../';
  const others = services.filter((x) => x.slug !== s.slug);
  const body = `
  <section class="hero hero--page">
    <div class="container">
      ${crumbs([{ name: 'Главная', href: rel }, { name: 'Услуги', href: '../' }, { name: s.name }])}
      <h1 class="page-title">${typo(s.h1)}</h1>
      <p class="page-lead">${typo(s.answer)}</p>
      <p class="page-meta">Обновлено: <time datetime="${updated}">${ruDate(updated)}</time> · ${esc(SITE.name)}, ${esc(SITE.kind)}</p>
      <div class="hero__actions">
        <a class="btn btn--accent" href="${rel}#contact">Обсудить проект <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
        <a class="btn btn--line" href="#cost">Сколько стоит</a>
      </div>
    </div>
  </section>

  <section class="section section--tight" aria-labelledby="facts-title">
    <div class="container">
      <h2 class="sr-only" id="facts-title">Коротко об условиях</h2>
      <dl class="facts">
        <div class="fact"><dt>Формат</dt><dd>${typo('Спринты по две недели, демо в конце каждого')}</dd></div>
        <div class="fact"><dt>Права</dt><dd>${typo('Код, макеты и доступы — ваши с первого дня')}</dd></div>
        <div class="fact"><dt>Оценка</dt><dd>${typo('Бесплатно, после брифа и созвона')}</dd></div>
        <div class="fact"><dt>Стек</dt><dd>${s.stack.slice(0, 4).map(esc).join(', ')}</dd></div>
      </dl>
    </div>
  </section>

  <section class="section section--tight" id="what">
    <div class="container page-grid">
      <h2 class="page-h2">Что входит в&nbsp;${typo(s.qAcc)}?</h2>
      <ul class="checklist">
        ${s.includes.map((x) => `<li>${typo(x)}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>

  <section class="section section--tight" id="cost">
    <div class="container page-grid">
      <h2 class="page-h2">Сколько стоит ${typo(s.q)}?</h2>
      <div class="prose">
        <p>${typo(s.costIntro)} ${typo('После брифа и созвона бесплатно готовим оценку с разбивкой по этапам: видно, из чего складывается цена и что можно отложить на вторую очередь.')}</p>
        <h3>От чего зависит цена</h3>
        <ul class="checklist checklist--small">${s.costFactors.map((x) => `<li>${typo(x)}</li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="section section--tight" id="timing">
    <div class="container page-grid">
      <h2 class="page-h2">Сколько времени занимает ${typo(s.q)}?</h2>
      <div class="prose">
        <p>${typo(s.timeIntro)} ${typo('Точный срок называем после аналитики и фиксируем в договоре.')}</p>
        <h3>Что влияет на срок</h3>
        <ul class="checklist checklist--small">${s.timeFactors.map((x) => `<li>${typo(x)}</li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="section band is-dark" id="process">
    <div class="container">
      <div class="section__head">
        <h2 class="section__title">Как проходит <em>работа</em>?</h2>
        <p class="section__note">${typo('Пять шагов от первого разговора до запуска. Результат показываем каждые две недели.')}</p>
      </div>
      <ol class="steps">
        ${s.process
          .map(
            ([t, d], i) => `<li class="step${i === s.process.length - 1 ? ' step--final' : ''}">
          <span class="step__num">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="step__title">${typo(t)}</h3>
          <p class="step__text">${typo(d)}</p>
        </li>`
          )
          .join('\n        ')}
      </ol>
    </div>
  </section>

  <section class="section section--tight" id="stack">
    <div class="container page-grid">
      <h2 class="page-h2">На каких технологиях делаем?</h2>
      <ul class="tags">${s.stack.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </section>
${faqBlock(s.faq, { note: `Не нашли свой? <a class="link link--inline" href="${rel}#contact">Напишите нам</a>&nbsp;— ответим в&nbsp;течение рабочего дня.`, idPrefix: 'faq' })}

  <section class="panel">
    <div class="container">
      <div class="section__head">
        <h2 class="section__title">Другие <em>услуги</em>.</h2>
        <p class="section__note"><a class="link" href="../">Все услуги студии</a></p>
      </div>
      <div class="svc-grid">
        ${others.map((o) => `<a class="svc-card" href="../${o.slug}/"><span class="svc-card__name">${typo(o.name)}</span><span class="svc-card__text">${typo(o.short)}</span></a>`).join('\n        ')}
      </div>
    </div>
  </section>
${cta(rel)}`;
  return page({ headHtml, rel, services, body, updated });
}

/* ---------------- раздел «Услуги» ---------------- */
export function hubPage({ hub, services, headHtml, updated }) {
  const rel = '../';
  const body = `
  <section class="hero hero--page">
    <div class="container">
      ${crumbs([{ name: 'Главная', href: rel }, { name: 'Услуги' }])}
      <h1 class="page-title">${typo(hub.h1)}</h1>
      <p class="page-lead">${typo(hub.answer)}</p>
      <p class="page-meta">Обновлено: <time datetime="${updated}">${ruDate(updated)}</time> · ${esc(SITE.name)}, ${esc(SITE.kind)}</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section__head">
        <h2 class="section__title">Что мы <em>разрабатываем</em>?</h2>
        <p class="section__note">${typo('Можно заказать проект целиком или отдельный этап — только дизайн, только разработку или аудит.')}</p>
      </div>
      <div class="svc-grid svc-grid--dark">
        ${services.map((s, i) => `<a class="svc-card" href="${s.slug}/"><span class="svc-card__num">${String(i + 1).padStart(2, '0')}</span><span class="svc-card__name">${typo(s.name)}</span><span class="svc-card__text">${typo(s.short)}</span></a>`).join('\n        ')}
      </div>
    </div>
  </section>
${cta(rel)}`;
  return page({ headHtml, rel, services, body, updated });
}

/* ---------------- 404 ---------------- */
export function notFoundPage({ services, headHtml }) {
  // Пути от корня: GitHub Pages отдаёт 404.html по любому несуществующему адресу
  const body = `
  <section class="hero hero--page hero--404">
    <div class="container">
      <p class="page-meta">Ошибка 404</p>
      <h1 class="page-title">Такой страницы нет</h1>
      <p class="page-lead">${typo('Возможно, ссылка устарела или в адресе опечатка. Начните с главной или посмотрите услуги студии.')}</p>
      <div class="hero__actions">
        <a class="btn btn--accent" href="${BASE}">На главную <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
        <a class="btn btn--line" href="${BASE}uslugi/">Услуги</a>
      </div>
    </div>
  </section>`;
  return page({ headHtml, rel: BASE, services, body, updated: SITE.updated });
}

/* ---------------- юридические документы ---------------- */
function legalParts(parts, rel) {
  return parts
    .map((p) => {
      if (typeof p === 'string') return typo(p);
      if (p.todo) return `<mark class="todo">[${esc(p.todo)}]</mark>`;
      if (p.link) return `<a class="link link--inline" href="${rel}${p.href}">${typo(p.link)}</a>`;
      return typo(p.text);
    })
    .join('');
}

function legalBlock(b, rel) {
  if (Array.isArray(b)) return `<p>${legalParts(b, rel)}</p>`;
  if (b.list) return `<ul>${b.list.map((x) => `<li>${typo(x)}</li>`).join('')}</ul>`;
  if (b.table) {
    const [head, ...rows] = b.table;
    return `<div class="legal__table"><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${typo(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table></div>`;
  }
  return '';
}

export function legalPage({ doc, services, headHtml }) {
  const rel = '../';
  const edition = SITE.legal.edition;
  const body = `
  <section class="hero hero--page">
    <div class="container">
      ${crumbs([{ name: 'Главная', href: rel }, { name: doc.nav }])}
      <h1 class="page-title">${typo(doc.h1)}</h1>
      <p class="page-meta">Редакция от&nbsp;<time datetime="${edition}">${ruDate(edition)}</time></p>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container legal">
      ${doc.sections
        .map(([h, blocks]) => `${h ? `<h2>${typo(h)}</h2>` : ''}\n      ${blocks.map((b) => legalBlock(b, rel)).join('\n      ')}`)
        .join('\n      ')}
      <nav class="legal__other" aria-label="Другие документы">
        ${LEGAL_PAGES.filter((d) => d.slug !== doc.slug).map((d) => `<a class="link" href="${rel}${d.slug}/">${esc(d.nav)}</a>`).join('\n        ')}
      </nav>
    </div>
  </section>`;
  return page({ headHtml, rel, services, body, updated: edition });
}

/* ---------------- пригласить в тендер ---------------- */
export function tenderPage({ t, services, headHtml, updated }) {
  const rel = '../';
  const body = `
  <section class="hero hero--page">
    <div class="container">
      ${crumbs([{ name: 'Главная', href: rel }, { name: 'Пригласить в тендер' }])}
      <h1 class="page-title">${typo(t.h1)}</h1>
      <p class="page-lead">${typo(t.answer)}</p>
      <p class="page-meta">Обновлено: <time datetime="${updated}">${ruDate(updated)}</time> · ${esc(SITE.name)}, ${esc(SITE.kind)}</p>
    </div>
  </section>

  <section class="section">
    <div class="container tender">
      <div class="tender__aside">
        <h2>Что приложить к&nbsp;приглашению?</h2>
        <ul class="checklist">
          ${t.attach.map((x) => `<li>${typo(x)}</li>`).join('\n          ')}
        </ul>
        <p class="section__note" style="margin-top:24px">${typo('Если документации пока нет — опишите задачу своими словами. Подготовим предложение по этапам и ответим на вопросы.')}</p>
      </div>

      <form class="form" id="tender-form" novalidate data-lead-form="tender">
        <div class="field-row">
          <div class="field">
            <label for="t-company">Компания</label>
            <input id="t-company" name="company" type="text" autocomplete="organization" required>
          </div>
          <div class="field">
            <label for="t-name">Контактное лицо</label>
            <input id="t-name" name="name" type="text" autocomplete="name" required>
          </div>
        </div>
        <div class="field">
          <label for="t-contact">Телефон или почта</label>
          <input id="t-contact" name="contact" type="text" autocomplete="off" required>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="t-link">Ссылка на&nbsp;закупку или площадка</label>
            <input id="t-link" name="link" type="text" inputmode="url" placeholder="https://">
          </div>
          <div class="field">
            <label for="t-deadline">Срок подачи предложений</label>
            <input id="t-deadline" name="deadline" type="date">
          </div>
        </div>
        <div class="field">
          <label for="t-about">Коротко о&nbsp;задаче</label>
          <textarea id="t-about" name="about" rows="4"></textarea>
        </div>

        <div class="field field--consent">
          <label class="consent" for="t-consent">
            <input id="t-consent" name="consent" type="checkbox" required>
            <span>Я даю <a href="${rel}consent/">согласие на&nbsp;обработку персональных данных</a> и&nbsp;ознакомлен(а) с&nbsp;<a href="${rel}privacy/">Политикой конфиденциальности</a></span>
          </label>
        </div>

        <div class="form__foot">
          <button class="btn btn--accent" type="submit">Отправить приглашение <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></button>
        </div>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>`;
  return page({ headHtml, rel, services, body, updated });
}
