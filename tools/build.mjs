// Сборка SEO-слоя сайта: страницы услуг, <head> и JSON-LD главной, sitemap, robots, llms.txt.
// Запуск: node tools/build.mjs   (без зависимостей, Node 18+)
// Главная (index.html) редактируется руками; сборщик заменяет только блоки между маркерами <!-- build:имя -->.
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, FACTS, abs } from './seo/config.mjs';
import { SERVICES, HOME, HOME_FAQ, HUB, TENDER, ABOUT, CASES, CASES_HUB, CLIENTS, PRODUCT } from './seo/content.mjs';
import {
  ID, graph, buildOrganization, buildWebSite, buildWebPage, buildPrimaryImage, buildBreadcrumbs,
  buildService, buildFaqPage, buildItemList,
} from './seo/jsonld.mjs';
import {
  head, header, footer, homeServices, faqItems, formChips, servicePage, hubPage, notFoundPage, servicePath, legalPage, tenderPage, aboutPage, casesHubPage, casePage, homeCases, casePath, clientsTicker, homeProduct, productPage, BASE,
} from './seo/templates.mjs';
import { LEGAL_PAGES, missingLegal } from './seo/legal.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p) => join(ROOT, p);

// Метка версии стилей и скрипта по их содержимому: после правки файла адрес меняется,
// и браузер не берёт старую копию из кэша (GitHub Pages разрешает кэшировать 10 минут).
const VERSION = Object.fromEntries(
  ['css/style.css', 'js/main.js'].map((f) => [f, createHash('sha1').update(readFileSync(join(ROOT, f))).digest('hex').slice(0, 8)])
);
const bust = (html) => html.replace(/(css\/style\.css|js\/main\.js)(\?v=\w+)?(?=")/g, (m, f) => `${f}?v=${VERSION[f]}`);

const write = async (p, content) => {
  await mkdir(dirname(out(p)), { recursive: true });
  await writeFile(out(p), p.endsWith('.html') ? bust(content) : content);
};

const pages = []; // для sitemap и проверок: { path, file, title, description, updated, faq }

/* ---------- страницы услуг ---------- */
// удаляем старые страницы услуг, которых больше нет в контенте
if (existsSync(out('uslugi'))) {
  for (const d of await readdir(out('uslugi'), { withFileTypes: true })) {
    if (d.isDirectory() && !SERVICES.some((s) => s.slug === d.name)) await rm(out(`uslugi/${d.name}`), { recursive: true });
  }
}

for (const s of SERVICES) {
  const path = servicePath(s);
  const updated = s.updated || SITE.updated;
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: s.title, description: s.description, updated, about: ID.service(path), mainEntity: ID.service(path) }),
    buildPrimaryImage(path),
    buildBreadcrumbs(path, [
      { name: 'Главная', path: '/' },
      { name: 'Услуги', path: '/uslugi/' },
      { name: s.name, path },
    ]),
    buildService(s, path),
    buildFaqPage(path, s.faq),
  ]);
  const headHtml = head({ title: s.title, description: s.description, path, rel: '../../', jsonld });
  const file = `uslugi/${s.slug}/index.html`;
  await write(file, servicePage({ s, services: SERVICES, headHtml, updated }));
  pages.push({ path, file, title: s.title, description: s.description, updated, faq: s.faq, priority: '0.8' });
}

/* ---------- раздел «Услуги» ---------- */
{
  const path = HUB.path;
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: HUB.title, description: HUB.description, type: 'CollectionPage', mainEntity: abs(`${path}#services`) }),
    buildPrimaryImage(path),
    buildBreadcrumbs(path, [
      { name: 'Главная', path: '/' },
      { name: 'Услуги', path },
    ]),
    buildItemList(path, SERVICES, servicePath),
  ]);
  const headHtml = head({ title: HUB.title, description: HUB.description, path, rel: '../', jsonld });
  await write('uslugi/index.html', hubPage({ hub: HUB, services: SERVICES, headHtml, updated: SITE.updated }));
  pages.push({ path, file: 'uslugi/index.html', title: HUB.title, description: HUB.description, updated: SITE.updated, priority: '0.9' });
}

/* ---------- проекты (кейсы) ---------- */
if (existsSync(out('proekty'))) {
  for (const d of await readdir(out('proekty'), { withFileTypes: true })) {
    if (d.isDirectory() && !CASES.some((c) => c.slug === d.name)) await rm(out(`proekty/${d.name}`), { recursive: true });
  }
}
{
  const path = CASES_HUB.path;
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: CASES_HUB.title, description: CASES_HUB.description, type: 'CollectionPage', mainEntity: abs(`${path}#cases`) }),
    buildPrimaryImage(path),
    buildBreadcrumbs(path, [
      { name: 'Главная', path: '/' },
      { name: 'Проекты', path },
    ]),
    {
      '@type': 'ItemList',
      '@id': abs(`${path}#cases`),
      name: 'Проекты студии Vecode',
      numberOfItems: CASES.length,
      itemListElement: CASES.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(casePath(c)), name: c.name })),
    },
  ]);
  const headHtml = head({ title: CASES_HUB.title, description: CASES_HUB.description, path, rel: '../', jsonld });
  await write('proekty/index.html', casesHubPage({ hub: CASES_HUB, cases: CASES, services: SERVICES, headHtml, updated: SITE.updated }));
  pages.push({ path, file: 'proekty/index.html', title: CASES_HUB.title, description: CASES_HUB.description, updated: SITE.updated, priority: '0.8' });
}
for (const [i, c] of CASES.entries()) {
  const path = casePath(c);
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: c.title, description: c.description }),
    buildPrimaryImage(path),
    buildBreadcrumbs(path, [
      { name: 'Главная', path: '/' },
      { name: 'Проекты', path: CASES_HUB.path },
      { name: c.name, path },
    ]),
  ]);
  const headHtml = head({ title: c.title, description: c.description, path, rel: '../../', jsonld });
  const next = CASES[(i + 1) % CASES.length];
  await write(`proekty/${c.slug}/index.html`, casePage({ c, next, services: SERVICES, headHtml, updated: SITE.updated }));
  pages.push({ path, file: `proekty/${c.slug}/index.html`, title: c.title, description: c.description, updated: SITE.updated, priority: '0.7' });
}

/* ---------- собственный продукт ---------- */
{
  const path = PRODUCT.path;
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: PRODUCT.title, description: PRODUCT.description }),
    buildPrimaryImage(path),
    buildBreadcrumbs(path, [
      { name: 'Главная', path: '/' },
      { name: PRODUCT.name, path },
    ]),
  ]);
  const headHtml = head({ title: PRODUCT.title, description: PRODUCT.description, path, rel: '../', jsonld });
  await write('firstcrm/index.html', productPage({ p: PRODUCT, cases: CASES, services: SERVICES, headHtml, updated: SITE.updated }));
  pages.push({ path, file: 'firstcrm/index.html', title: PRODUCT.title, description: PRODUCT.description, updated: SITE.updated, priority: '0.8' });
}

/* ---------- о студии ---------- */
{
  const path = ABOUT.path;
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: ABOUT.title, description: ABOUT.description, type: 'AboutPage', updated: SITE.updated, mainEntity: ID.org }),
    buildPrimaryImage(path),
    buildBreadcrumbs(path, [
      { name: 'Главная', path: '/' },
      { name: 'О студии', path },
    ]),
  ]);
  const headHtml = head({ title: ABOUT.title, description: ABOUT.description, path, rel: '../', jsonld });
  await write('o-studii/index.html', aboutPage({ a: ABOUT, services: SERVICES, headHtml, updated: SITE.updated }));
  pages.push({ path, file: 'o-studii/index.html', title: ABOUT.title, description: ABOUT.description, updated: SITE.updated, priority: '0.7' });
}

/* ---------- пригласить в тендер ---------- */
{
  const path = TENDER.path;
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: TENDER.title, description: TENDER.description, type: 'ContactPage' }),
    buildPrimaryImage(path),
    buildBreadcrumbs(path, [
      { name: 'Главная', path: '/' },
      { name: 'Пригласить в тендер', path },
    ]),
  ]);
  const headHtml = head({ title: TENDER.title, description: TENDER.description, path, rel: '../', jsonld });
  await write('tender/index.html', tenderPage({ t: TENDER, services: SERVICES, headHtml, updated: SITE.updated }));
  pages.push({ path, file: 'tender/index.html', title: TENDER.title, description: TENDER.description, updated: SITE.updated, priority: '0.6' });
}

/* ---------- юридические документы (noindex, follow; не в sitemap) ---------- */
for (const doc of LEGAL_PAGES) {
  const path = `/${doc.slug}/`;
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: doc.title, description: doc.description, updated: SITE.legal.edition }),
    buildPrimaryImage(path),
    buildBreadcrumbs(path, [
      { name: 'Главная', path: '/' },
      { name: doc.nav, path },
    ]),
  ]);
  const headHtml = head({ title: doc.title, description: doc.description, path, rel: '../', robots: 'noindex, follow', jsonld });
  await write(`${doc.slug}/index.html`, legalPage({ doc, services: SERVICES, headHtml }));
  pages.push({ path, file: `${doc.slug}/index.html`, title: doc.title, description: doc.description, updated: SITE.legal.edition, noindex: true });
}

/* ---------- 404 ---------- */
{
  const headHtml = head({
    title: 'Страница не найдена — Vecode',
    description: 'Такой страницы нет. Перейдите на главную или в раздел услуг студии разработки Vecode.',
    path: null,
    robots: 'noindex, follow',
    absoluteAssets: true,
  });
  await write('404.html', notFoundPage({ services: SERVICES, headHtml }));
}

/* ---------- главная: замена блоков между маркерами ---------- */
{
  const path = '/';
  let html = await readFile(out('index.html'), 'utf8');
  const jsonld = graph([
    buildOrganization({ services: SERVICES }),
    buildWebSite(),
    buildWebPage({ path, title: HOME.title, description: HOME.description, breadcrumb: false }),
    buildPrimaryImage(path),
    buildFaqPage(path, HOME_FAQ),
  ]);
  const blocks = {
    head: head({ title: HOME.title, description: HOME.description, path, rel: '', jsonld }),
    header: header('', { home: true }),
    services: homeServices(SERVICES),
    ticker: clientsTicker(CLIENTS),
    work: homeCases(CASES),
    product: homeProduct(PRODUCT),
    faq: faqItems(HOME_FAQ, 'faq'),
    chips: formChips(SERVICES),
    footer: footer('', SERVICES, { home: true }),
  };
  for (const [name, content] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(html)) throw new Error(`В index.html нет маркеров <!-- build:${name} --> … <!-- /build:${name} -->`);
    html = html.replace(re, `$1\n${content.trim()}\n$2`);
  }
  await writeFile(out('index.html'), bust(html));
  pages.unshift({ path, file: 'index.html', title: HOME.title, description: HOME.description, updated: SITE.updated, faq: HOME_FAQ, priority: '1.0' });
}

/* ---------- sitemap.xml ---------- */
await write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => !p.noindex).map((p) => `  <url>\n    <loc>${abs(p.path)}</loc>\n    <lastmod>${p.updated}</lastmod>\n  </url>`).join('\n')}
</urlset>
`
);

/* ---------- robots.txt ---------- */
// AI-краулеры разрешены — решение владельца от 18.11.2026 (видимость в ИИ-поиске, GEO)
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'CCBot', 'Meta-ExternalAgent', 'Amazonbot', 'DuckAssistBot', 'MistralAI-User',
];
const rules = 'Allow: /\nDisallow: /tools/\nDisallow: /package.json';
await write(
  'robots.txt',
  `# robots.txt — ${SITE.url.replace('https://', '')}
# Сгенерировано tools/build.mjs. Правьте источник, а не этот файл.

User-agent: *
${rules}

User-agent: Googlebot
${rules}

User-agent: Bingbot
${rules}

# Яндекс: склеиваем адреса с UTM и рекламными метками в один
User-agent: Yandex
${rules}
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid&fbclid&from

# AI-краулеры: разрешены (ответы ChatGPT, Claude, Perplexity, Google AI и др.)
${AI_BOTS.map((b) => `User-agent: ${b}`).join('\n')}
${rules}

Sitemap: ${abs('/sitemap.xml')}
`
);

/* ---------- llms.txt и llms-full.txt ---------- */
const svcLine = (s) => `- [${s.name}](${abs(servicePath(s))}): ${s.short}`;
await write(
  'llms.txt',
  `# ${SITE.name}

> ${SITE.description}

Другие названия: ${SITE.alternateNames.join(', ')}. Сайт: ${abs('/')}. Язык: русский. География: ${SITE.areaServed.join(', ')}.

Ключевые факты:
${FACTS.map((f) => `- ${f}`).join('\n')}
- Цены и сроки называем после брифа: оценка с разбивкой по этапам бесплатна.

## Услуги

${SERVICES.map(svcLine).join('\n')}

## Страницы

- [Главная](${abs('/')}): о студии, принципы, процесс работы, частые вопросы
- [О студии](${abs('/o-studii/')}): кто мы, чем занимаемся, принципы работы
- [Все услуги](${abs('/uslugi/')}): обзор восьми направлений
- [FirstCRM](${abs('/firstcrm/')}): собственный продукт студии — CRM для B2B-продаж, в процессе разработки
- [Проекты](${abs('/proekty/')}): кейсы с задачами, решениями и цифрами
${CASES.map((c) => `- [${c.name}](${abs(casePath(c))}): ${c.lead}`).join('\n')}
- [Частые вопросы](${abs('/#faq')}): стоимость, сроки, права на код, поддержка
- [Оставить заявку](${abs('/#contact')}): форма для обсуждения проекта
- [Пригласить в тендер](${abs('/tender/')}): приглашение в тендер или закупку

## Optional

- [Полное описание услуг для LLM](${abs('/llms-full.txt')})
`
);

const strip = (s) => s;
await write(
  'llms-full.txt',
  `# ${SITE.name} — полное описание услуг

> ${SITE.description}

Обновлено: ${SITE.updated}. Источник: ${abs('/')}

## Как мы работаем

${FACTS.map((f) => `- ${f}`).join('\n')}

## Частые вопросы

${HOME_FAQ.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')}

${SERVICES.map(
  (s) => `---

## ${s.h1}

URL: ${abs(servicePath(s))}

${strip(s.answer)}

### Что входит

${s.includes.map((x) => `- ${x}`).join('\n')}

### Сколько стоит ${s.q}?

${s.costIntro} После брифа и созвона бесплатно готовим оценку с разбивкой по этапам.

От чего зависит цена: ${s.costFactors.join('; ')}.

### Сколько времени занимает ${s.q}?

${s.timeIntro} Точный срок называем после аналитики и фиксируем в договоре.

### Как проходит работа

${s.process.map(([t, d], i) => `${i + 1}. ${t}. ${d}`).join('\n')}

### Технологии

${s.stack.join(', ')}

### Вопросы и ответы

${s.faq.map(([q, a]) => `**${q}**\n${a}`).join('\n\n')}`
).join('\n\n')}
`
);

/* ---------- проверки ---------- */
const problems = [];
const textOf = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');
const norm = (s) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

const report = [];
for (const p of [...pages, { path: null, file: '404.html', title: 'Страница не найдена — Vecode', description: '' }]) {
  const html = await readFile(out(p.file), 'utf8');
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) problems.push(`${p.file}: H1 на странице — ${h1}, должен быть ровно один`);
  const titles = (html.match(/<title>/g) || []).length;
  if (titles !== 1) problems.push(`${p.file}: тегов <title> — ${titles}`);
  if (p.path) {
    if (p.title.length > 60) problems.push(`${p.file}: title ${p.title.length} симв. (> 60)`);
    if (p.description.length < 120 || p.description.length > 160) problems.push(`${p.file}: description ${p.description.length} симв. (нужно 120–160)`);
    if (!html.includes(`<link rel="canonical" href="${abs(p.path)}">`)) problems.push(`${p.file}: нет canonical`);
  } else if (!html.includes('noindex')) problems.push(`${p.file}: 404 без noindex`);

  // JSON-LD: валидный JSON, есть @context и @graph
  const blocksLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const m of blocksLd) {
    try {
      const data = JSON.parse(m[1]);
      if (data['@context'] !== 'https://schema.org') problems.push(`${p.file}: JSON-LD без @context`);
      // определённые узлы: любой объект с @id и хотя бы одним свойством кроме него (в том числе вложенный)
      const ids = new Set();
      const walk = (v) => {
        if (Array.isArray(v)) return v.forEach(walk);
        if (v && typeof v === 'object') {
          if (v['@id'] && Object.keys(v).length > 1) ids.add(v['@id']);
          Object.values(v).forEach(walk);
        }
      };
      walk(data['@graph']);
      // все ссылки {"@id": …} должны вести на узлы этого же графа
      const refs = JSON.stringify(data).match(/\{"@id":"[^"]+"\}/g) || [];
      for (const r of refs) {
        const id = JSON.parse(r)['@id'];
        if (!ids.has(id)) problems.push(`${p.file}: ссылка на отсутствующий узел ${id}`);
      }
    } catch (e) {
      problems.push(`${p.file}: невалидный JSON-LD — ${e.message}`);
    }
  }
  // FAQ в разметке = видимый текст
  if (p.faq) {
    const visible = norm(textOf(html.replace(/<head>[\s\S]*?<\/head>/, '')));
    for (const [q, a] of p.faq) {
      if (!visible.includes(norm(q))) problems.push(`${p.file}: вопрос не виден на странице — «${q}»`);
      if (!visible.includes(norm(a))) problems.push(`${p.file}: ответ не виден на странице — «${q}»`);
    }
  }
  // внутренние ссылки ведут на существующие файлы
  for (const m of html.matchAll(/href="([^"#:]+?)(#[^"]*)?"/g)) {
    const href = m[1].split('?')[0]; // ?v=… — метка версии, к файлу отношения не имеет
    if (!href || href.startsWith('mailto') || href.startsWith('tel')) continue;
    const base = p.file === '404.html' ? '' : dirname(p.file);
    const target = href.startsWith('/') ? href.slice(BASE.length) : join(base, href);
    const file = target.endsWith('/') || target === '' || target === '.' ? join(target, 'index.html') : target;
    if (!existsSync(out(file))) problems.push(`${p.file}: битая ссылка ${href}`);
  }
  report.push({ file: p.file, title: p.title.length, desc: p.description.length || '—', jsonld: blocksLd.length, faq: p.faq?.length || 0 });
}

console.table(report);
console.log(`Страниц в sitemap: ${pages.filter((p) => !p.noindex).length}, документов (noindex): ${pages.filter((p) => p.noindex).length}. Файлы: sitemap.xml, robots.txt, llms.txt, llms-full.txt, 404.html`);
const todo = missingLegal();
if (todo.length) {
  console.warn(`\n⚠ В юридических документах не заполнены реквизиты: ${todo.join(', ')}.\n  Заполните SITE.legal в tools/seo/config.mjs перед публикацией — сейчас на страницах видны пометки «[укажите …]».`);
}
if (problems.length) {
  console.error(`\nПроблемы (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Проверки пройдены: title/description, один H1, canonical, валидный JSON-LD со связанными @id, FAQ совпадает с видимым текстом, ссылки целы.');
}
