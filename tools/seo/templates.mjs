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
      <a href="${r}o-studii/">О студии</a>
      <a href="${r}uslugi/">Услуги</a>
      <a href="${r}proekty/">Проекты</a>
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
    <a href="${r}o-studii/"><span>01</span>О студии</a>
    <a href="${r}uslugi/"><span>02</span>Услуги</a>
    <a href="${r}proekty/"><span>03</span>Проекты</a>
    <a href="${r}#process"><span>04</span>Процесс</a>
    <a href="${r}#faq"><span>05</span>Вопросы</a>
    <a href="${r}#contact"><span>06</span>Контакты</a>
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
        <a href="${r}o-studii/">О студии</a>
        <a href="${r}#process">Как мы работаем</a>
        <a href="${r}#faq">Вопросы и ответы</a>
      </nav>
      <nav class="footer__col" aria-label="Проекты">
        <p class="footer__label">Проекты</p>
        <a href="${r}proekty/">Портфолио</a>
        <a href="${r}uslugi/">Услуги</a>
        <a href="${r}firstcrm/">FirstCRM</a>
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

/* ---------------- о студии ---------------- */
export function aboutPage({ a, services, headHtml, updated }) {
  const rel = '../';
  const bySlug = Object.fromEntries(services.map((s) => [s.slug, s]));
  const L = SITE.legal;
  const requisites = [
    ['Полное наименование', L.operator],
    ['ИНН', L.inn],
    ['ОГРН', L.ogrn],
    ['Юридический адрес', L.address],
    ['Почта', SITE.email],
    ['Телефон', SITE.phone],
  ].filter(([, v]) => v);
  const body = `
  <section class="hero hero--page">
    <div class="container">
      ${crumbs([{ name: 'Главная', href: rel }, { name: 'О студии' }])}
      <h1 class="page-title">${typo(a.h1)}</h1>
      <p class="page-lead">${typo(a.answer)}</p>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container about-intro">
      <h2 class="about-intro__title" data-reveal>${typo(a.intro.title)}</h2>
      <div class="about-intro__body" data-reveal>
        ${a.intro.text.map((t) => `<p>${typo(t)}</p>`).join('\n        ')}
        <div class="about-intro__actions">
          <a class="btn btn--accent" href="${rel}#contact">Обсудить проект <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
          <a class="btn btn--line" href="${rel}#process">Как мы работаем</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section__head">
        <h2 class="section__title" data-reveal>Студия в&nbsp;<em>цифрах</em>.</h2>
        <p class="section__note" data-reveal>${typo('Правила, по которым мы работаем на каждом проекте.')}</p>
      </div>
      <div class="stats">
        ${a.stats.map(([n, u, t]) => `<div class="stat" data-reveal>
          <p class="stat__num">${esc(n)}<small>${esc(u)}</small></p>
          <p class="stat__label">${typo(t)}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="panel" id="areas">
    <div class="container">
      <div class="section__head">
        <h2 class="section__title" data-reveal>Чем <em>занимаемся</em>.</h2>
        <p class="section__note" data-reveal><a class="link" href="${rel}uslugi/">Все услуги <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a></p>
      </div>
      <div class="about-grid">
        ${a.areas.map((g, i) => `<article class="about-card" data-reveal>
          <span class="about-card__num">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="about-card__title">${typo(g.name)}</h3>
          <p class="about-card__text">${typo(g.text)}</p>
          <div class="about-card__links">
            ${(g.links.length ? g.links.map((sl) => `<a class="link" href="${rel}uslugi/${sl}/">${typo(bySlug[sl].name)} <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>`) : [`<a class="link" href="${rel}#contact">Обсудить поддержку <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>`]).join('\n            ')}
          </div>
        </article>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container about-product" data-reveal>
      <p class="tile__tag">собственный продукт</p>
      <h2 class="about-product__title">${typo(a.product.title)}</h2>
      <p class="about-product__text">${typo(a.product.text)}</p>
      <a class="link" href="${rel}firstcrm/">Подробнее о FirstCRM <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
    </div>
  </section>

  <section class="section section--after-tight">
    <div class="container">
      <div class="section__head">
        <h2 class="section__title" data-reveal>Наши <em>принципы</em>.</h2>
      </div>
      <div class="bento bento--flush">
        ${a.principles.map(([tag, t, d], i) => `<article class="tile${i === 2 ? ' tile--accent' : ''}" data-reveal>
          <p class="tile__tag">${esc(tag)}</p>
          <h3 class="tile__title">${typo(t)}</h3>
          <p class="tile__text">${typo(d)}</p>
        </article>`).join('\n        ')}
      </div>
    </div>
  </section>
${requisites.length ? `
  <section class="section" id="requisites">
    <div class="container about-intro">
      <h2 class="about-intro__title">Реквизиты</h2>
      <dl class="requisites">
        ${requisites.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n        ')}
      </dl>
    </div>
  </section>` : '  <!-- TODO: реквизиты появятся сами, когда будет заполнен SITE.legal в tools/seo/config.mjs -->'}
${cta(rel)}`;
  return page({ headHtml, rel, services, body, updated });
}

/* ---------------- кейсы ---------------- */
export const casePath = (c) => `/proekty/${c.slug}/`;

// Картинка кейса: два размера WebP (самый большой и вдвое меньший)
function caseImg(c, shot, rel, { sizes = '(max-width: 900px) 100vw, 60vw', eager = false, alt = shot.caption } = {}) {
  const half = shot.w / 2;
  const base = `${rel}assets/cases/${c.slug}/${shot.file}`;
  return `<img src="${base}-${half}.webp" srcset="${base}-${half}.webp ${half}w, ${base}-${shot.w}.webp ${shot.w}w" sizes="${sizes}" width="${shot.w}" height="${shot.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

const browserBar = '<span class="cc-bar" aria-hidden="true"><i></i><i></i><i></i></span>';

// iPhone: корпус с рамкой и кнопками, Dynamic Island и строка статуса над скриншотом
const IPHONE_STATUS = `<div class="iphone__status" aria-hidden="true"><span>9:41</span><svg viewBox="0 0 68 12" fill="currentColor"><rect x="0" y="7.5" width="3" height="4" rx="1"/><rect x="4.5" y="5.5" width="3" height="6" rx="1"/><rect x="9" y="3" width="3" height="8.5" rx="1"/><rect x="13.5" y="0.5" width="3" height="11" rx="1"/><path d="M27.5 3.2c2.6 0 5 1 6.8 2.7l1.2-1.3A11.6 11.6 0 0 0 27.5 1.4a11.6 11.6 0 0 0-8 3.2l1.2 1.3c1.8-1.7 4.2-2.7 6.8-2.7Zm0 3.6c1.6 0 3.1.6 4.2 1.6l1.2-1.3a8 8 0 0 0-5.4-2.1 8 8 0 0 0-5.4 2.1l1.2 1.3c1.1-1 2.6-1.6 4.2-1.6Zm0 3.6c.6 0 1.1.2 1.5.6l-1.5 1.6-1.5-1.6c.4-.4.9-.6 1.5-.6Z"/><rect x="42" y="1" width="22" height="10.5" rx="3" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="44" y="3" width="16" height="6.5" rx="1.6"/><rect x="65" y="4.3" width="1.8" height="3.8" rx=".9" fill-opacity=".4"/></svg></div>`;
const iphone = (cls, img) => `<div class="cc-phone ${cls}"><div class="iphone"><div class="iphone__screen">${IPHONE_STATUS}${img}</div><span class="iphone__island" aria-hidden="true"></span></div></div>`;

// Обложка: экраны в рамках браузера или телефона на цветном фоне, как в портфолио fcore
function caseCover(c, rel, { large = false, eager = false, fill = false } = {}) {
  const s = c.shots;
  const sizes = large ? '(max-width: 900px) 90vw, 70vw' : '(max-width: 900px) 90vw, 33vw';
  const inner =
    c.look.cover === 'phones'
      ? s.slice(0, 3).map((x, i) => iphone(`cc-phone--${i + 1}`, caseImg(c, x, rel, { sizes: large ? '(max-width: 900px) 30vw, 18vw' : '(max-width: 900px) 30vw, 10vw', eager: eager && i === 1, alt: '' }))).join('')
      : `<div class="cc-frame cc-frame--back">${browserBar}${caseImg(c, s[1], rel, { sizes, alt: '' })}</div><div class="cc-frame cc-frame--front">${browserBar}${caseImg(c, s[0], rel, { sizes, eager, alt: '' })}</div>`;
  return `<div class="case-cover case-cover--${c.look.cover}${large ? ' case-cover--large' : ''}${fill ? ' case-cover--fill' : ''}" style="--case-bg: ${c.look.bg}" role="img" aria-label="${esc(`${c.name}: экраны проекта`)}">${inner}</div>`;
}

function caseCard(c, rel, { featured = false } = {}) {
  return `<a class="case-card${featured ? ' case-card--featured' : ''}" href="${rel}proekty/${c.slug}/" data-reveal>
          ${caseCover(c, rel)}
          <span class="case-card__meta">${esc(c.category)} · ${esc(c.client)}</span>
          <span class="case-card__title">${typo(c.name)}</span>
          <span class="case-card__metric"><b>${esc(c.metric[0])}</b> ${typo(c.metric[1])}</span>
        </a>`;
}

/** Блок проектов на главной (между маркерами build:work): стопка карточек, которые прилипают к верху экрана
 * и наезжают друг на друга при прокрутке — как «лучшие кейсы» у fcore. Только CSS (position: sticky), без скриптов. */
export function homeCases(cases) {
  const total = String(cases.length).padStart(2, '0');
  return `    <div class="container">
      <div class="section__head">
        <h2 class="section__title" data-reveal>Наши <em>проекты</em>.</h2>
        <p class="section__note" data-reveal>${typo('Кейсы с задачей, решением и цифрами, которые можно проверить.')} <a class="link" href="proekty/">Все проекты <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a></p>
      </div>
      <div class="case-stack">
        ${cases.map((c, i) => `<a class="case-stack__card case-stack__card--${c.look.tone}" href="proekty/${c.slug}/" style="--i: ${i}; --case-bg: ${c.look.bg}">
          <div class="case-stack__info">
            <div class="case-stack__top"><span class="case-stack__pill">${String(i + 1).padStart(2, '0')} / ${total}</span><span class="case-stack__pill">${esc(c.category)}</span></div>
            <p class="case-stack__client">${esc(c.client)}</p>
            <h3 class="case-stack__title">${typo(c.name)}</h3>
            <p class="case-stack__lead">${typo(c.lead)}</p>
            <p class="case-stack__metric"><b>${esc(c.metric[0])}</b> ${typo(c.metric[1])}</p>
            <span class="case-stack__cta">Смотреть кейс <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></span>
          </div>
          <div class="case-stack__visual">${caseCover(c, '', { fill: true })}</div>
        </a>`).join('\n        ')}
      </div>
    </div>`;
}

export function casesHubPage({ hub, cases, services, headHtml, updated }) {
  const rel = '../';
  const cats = [...new Set(cases.map((c) => c.category))];
  const body = `
  <section class="hero hero--page">
    <div class="container">
      ${crumbs([{ name: 'Главная', href: rel }, { name: 'Проекты' }])}
      <h1 class="page-title">${typo(hub.h1)}<sup class="page-title__count">${cases.length}</sup></h1>
      <p class="page-lead">${typo(hub.answer)}</p>
      <p class="case-cats">${cats.map((c) => `<span>${esc(c)} <b>${cases.filter((x) => x.category === c).length}</b></span>`).join('')}</p>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <div class="cases-grid cases-grid--hub">
        ${cases.map((c, i) => caseCard(c, rel, { featured: i === 0 })).join('\n        ')}
      </div>
    </div>
  </section>
${cta(rel)}`;
  return page({ headHtml, rel, services, body, updated });
}

export function casePage({ c, next, services, headHtml, updated }) {
  const rel = '../../';
  const browsers = c.shots.filter((s) => s.kind !== 'phone');
  const phones = c.shots.filter((s) => s.kind === 'phone');
  const body = `
  <section class="hero hero--page case-hero">
    <div class="container">
      ${crumbs([{ name: 'Главная', href: rel }, { name: 'Проекты', href: `${rel}proekty/` }, { name: c.name }])}
      <p class="case-hero__meta">${esc(c.category)} / ${esc(c.client)}</p>
      <h1 class="page-title">${typo(c.name)}</h1>
      <p class="page-lead">${typo(c.lead)}</p>
      <ul class="case-tags" aria-label="Технологии">
        ${c.stack.map((t) => `<li>${esc(t)}</li>`).join('')}
      </ul>
      <div class="case-hero__actions">
        ${c.link ? `<a class="btn btn--accent" href="${esc(c.link.href)}" target="_blank" rel="noopener">Открыть ${esc(c.link.label)} <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>` : ''}
        <a class="btn btn--line" href="${rel}#contact">Обсудить похожий проект</a>
      </div>
    </div>
  </section>

  <section class="section section--tight case-cover-wrap">
    <div class="container">
      ${caseCover(c, rel, { large: true, eager: true })}
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <div class="stats">
        ${c.results.map(([n, t]) => `<div class="stat" data-reveal>
          <p class="stat__num">${esc(n)}</p>
          <p class="stat__label">${typo(t)}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container case-block">
      <h2 class="case-block__title" data-reveal>Задача</h2>
      <p class="case-block__lead" data-reveal>${typo(c.task)}</p>
    </div>
  </section>

${c.roles?.length ? `
  <section class="section section--tight">
    <div class="container">
      <h2 class="case-block__title case-roles__title" data-reveal>Команда ИИ-сотрудников</h2>
      <div class="case-roles">
        ${c.roles.map((r, i) => `<article class="case-role" data-reveal>
          <span class="case-role__num">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="case-role__name">${typo(r.name)}</h3>
          <p class="case-role__text">${typo(r.text)}</p>
        </article>`).join('\n        ')}
      </div>
    </div>
  </section>` : ''}

  <section class="section section--tight">
    <div class="container case-block">
      <h2 class="case-block__title" data-reveal>Что сделали</h2>
      <ol class="case-done" data-reveal>
        ${c.done.map((d) => `<li>${typo(d)}</li>`).join('\n        ')}
      </ol>
    </div>
  </section>

  <section class="panel case-gallery" aria-label="Экраны проекта">
    <div class="container">
      ${browsers.map((s) => `<figure class="case-shot${s.kind === 'browser' ? ' case-shot--browser' : ''}" data-reveal>
        ${s.kind === 'browser' ? `<div class="cc-frame cc-frame--static">${browserBar}${caseImg(c, s, rel, { sizes: '(max-width: 1200px) 94vw, 1100px' })}</div>` : s.kind === 'doc' ? `<div class="case-doc">${caseImg(c, s, rel, { sizes: '(max-width: 900px) 90vw, 640px' })}</div>` : caseImg(c, s, rel, { sizes: '(max-width: 1200px) 94vw, 1100px' })}
        <figcaption>${typo(s.caption)}</figcaption>
      </figure>`).join('\n      ')}
      ${phones.length ? `<div class="case-phones">
        ${phones.map((s) => `<figure class="case-shot" data-reveal>
          ${iphone('cc-phone--static', caseImg(c, s, rel, { sizes: '(max-width: 900px) 45vw, 22vw' }))}
          <figcaption>${typo(s.caption)}</figcaption>
        </figure>`).join('\n        ')}
      </div>` : ''}
    </div>
  </section>
${c.changes.length ? `
  <section class="section section--tight">
    <div class="container case-block">
      <h2 class="case-block__title" data-reveal>Что изменилось для клиента</h2>
      <ul class="checklist" data-reveal>
        ${c.changes.map((d) => `<li>${typo(d)}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>` : ''}

  <section class="section section--tight">
    <div class="container">
      <a class="case-next" href="${rel}proekty/${next.slug}/">
        <span class="case-next__label">Следующий проект</span>
        <span class="case-next__name">${typo(next.name)}</span>
        <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>
      </a>
    </div>
  </section>
${cta(rel)}`;
  return page({ headHtml, rel, services, body, updated });
}

/** Бегущая строка с клиентами на главной (между маркерами build:ticker). Вторая копия — для бесшовной прокрутки. */
export function clientsTicker(clients) {
  const items = [...clients, ...clients, ...clients].map((c) => `<span>${typo(c)}</span><i></i>`).join('');
  return `  <div class="ticker ticker--clients">
    <p class="ticker__label">Наши клиенты</p>
    <ul class="sr-only">${clients.map((c) => `<li>${typo(c)}</li>`).join('')}</ul>
    <div class="ticker__viewport" aria-hidden="true">
      <div class="ticker__track">
        <div class="ticker__group">${items}</div>
        <div class="ticker__group">${items}</div>
      </div>
    </div>
  </div>`;
}

/* ---------------- собственный продукт ---------------- */

/** Блок продукта на главной (между маркерами build:product) */
export function homeProduct(p) {
  return `    <div class="container product-teaser" data-reveal>
      <div class="product-teaser__info">
        <p class="tile__tag">собственный продукт</p>
        <h2 class="product-teaser__title">${esc(p.name)}</h2>
        <p class="product-teaser__text">${typo(p.lead)}</p>
        <p class="product-teaser__status">${typo(p.status)}</p>
        <div class="product-teaser__actions">
          <a class="btn btn--accent" href="firstcrm/">О продукте <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
          <a class="btn btn--line" href="#contact">Запросить доступ</a>
        </div>
      </div>
      <a class="product-teaser__visual" href="firstcrm/" aria-label="${esc(p.name)}: подробнее о продукте">${caseCover(p, '', {})}</a>
    </div>`;
}

export function productPage({ p, cases, services, headHtml, updated }) {
  const rel = '../';
  const bySlug = Object.fromEntries(cases.map((c) => [c.slug, c]));
  const body = `
  <section class="hero hero--page case-hero">
    <div class="container">
      ${crumbs([{ name: 'Главная', href: rel }, { name: p.name }])}
      <p class="case-hero__meta">Собственный продукт / ${esc(SITE.name)}</p>
      <h1 class="page-title">${typo(p.h1)}</h1>
      <p class="page-lead">${typo(p.lead)}</p>
      <ul class="case-tags" aria-label="Коротко о продукте">
        ${p.stack.map((t) => `<li>${esc(t)}</li>`).join('')}
      </ul>
      <p class="product-status">${typo(p.status)}</p>
      <div class="case-hero__actions">
        <a class="btn btn--accent" href="${rel}#contact">Запросить ранний доступ <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
        <a class="btn btn--line" href="${rel}uslugi/razrabotka-crm/">CRM под ваши процессы</a>
      </div>
    </div>
  </section>

  <section class="section section--tight case-cover-wrap">
    <div class="container">
      ${caseCover(p, rel, { large: true, eager: true })}
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <div class="stats">
        ${p.stats.map(([n, t]) => `<div class="stat" data-reveal>
          <p class="stat__num">${esc(n)}</p>
          <p class="stat__label">${typo(t)}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="panel" id="features">
    <div class="container">
      <div class="section__head">
        <h2 class="section__title" data-reveal>Что <em>умеет</em>.</h2>
        <p class="section__note" data-reveal>${typo('Всё, что нужно отделу продаж, без десятка отдельных сервисов.')}</p>
      </div>
      <div class="about-grid">
        ${p.features.map(([name, text], i) => `<article class="about-card" data-reveal>
          <span class="about-card__num">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="about-card__title">${typo(name)}</h3>
          <p class="about-card__text">${typo(text)}</p>
        </article>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section__head">
        <h2 class="section__title" data-reveal>Шаблоны <em>отраслей</em>.</h2>
        <p class="section__note" data-reveal>${typo('Этапы воронки и справочники под отрасль — из проектов, которые мы делали для клиентов. Компания выбирает шаблон при первом входе.')}</p>
      </div>
      <div class="bento bento--flush">
        ${p.industries.map(([name, text, slug], i) => `<article class="tile${i === 0 ? ' tile--accent' : ''}" data-reveal>
          <p class="tile__tag">шаблон</p>
          <h3 class="tile__title">${typo(name)}</h3>
          <p class="tile__text">${typo(text)}</p>
          ${slug && bySlug[slug] ? `<p class="tile__link"><a class="link" href="${rel}proekty/${slug}/">Кейс: ${typo(bySlug[slug].name)}</a></p>` : ''}
        </article>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="panel case-gallery" aria-label="Экраны продукта">
    <div class="container">
      ${p.shots.slice(2).map((s) => `<figure class="case-shot case-shot--browser" data-reveal>
        <div class="cc-frame cc-frame--static">${browserBar}${caseImg(p, s, rel, { sizes: '(max-width: 1200px) 94vw, 1100px' })}</div>
        <figcaption>${typo(s.caption)}</figcaption>
      </figure>`).join('\n      ')}
    </div>
  </section>

  <section class="section section--tight">
    <div class="container case-block">
      <h2 class="case-block__title" data-reveal>Данные и доверие</h2>
      <ul class="checklist" data-reveal>
        ${p.trust.map((d) => `<li>${typo(d)}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>
${cta(rel)}`;
  return page({ headHtml, rel, services, body, updated });
}
