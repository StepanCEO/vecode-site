/* =========================================================
   VECODE — скрипты сайта
   ========================================================= */

/* Настройки формы.
   formEndpoint — адрес, куда отправлять заявки (POST, JSON).
   Пока он пустой, форма открывает почтовую программу с готовым письмом
   на адрес из блока контактов (#contact-email в index.html). */
const CONFIG = {
  formEndpoint: '',
  // рабочая почта студии — на неё уходит письмо, если formEndpoint не задан
  email: 'vecode@vecode.tech',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- Экран загрузки ---------- */
// Показывается, только если его включил скрипт в <head> (один раз за сессию).
// Счётчик идёт ~1,6 с, но до 100% доходит не раньше, чем страница реально загрузилась (максимум 3,5 с).
(function initPreloader() {
  const root = document.documentElement;
  const el = document.querySelector('.preloader');
  if (!el || !root.classList.contains('is-preloading')) {
    el?.remove();
    return;
  }
  const countEl = el.querySelector('[data-preload-count]');
  const barEl = el.querySelector('[data-preload-bar]');
  const statusEl = el.querySelector('[data-preload-status]');
  const STATUSES = ['Собираем интерфейс', 'Подключаем API', 'Проверяем тесты', 'Деплой'];
  const DURATION = 1600;
  const MAX_WAIT = 3500;
  // отсчёт — с первого нарисованного кадра: тогда же стартует CSS-анимация слова
  let start = null;
  let loaded = document.readyState === 'complete';
  if (!loaded) window.addEventListener('load', () => (loaded = true), { once: true });

  // плавный разгон и торможение: цифры идут в такт анимации слова
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const show = (p) => {
    const v = Math.round(p * 100);
    countEl.textContent = String(v).padStart(3, '0');
    barEl.style.transform = `scaleX(${p})`;
    statusEl.textContent = v >= 100 ? 'Готово' : STATUSES[Math.min(STATUSES.length - 1, Math.floor(p * STATUSES.length))];
  };

  const finish = () => {
    try {
      sessionStorage.setItem('vc-intro', '1');
    } catch {
      /* приватный режим — просто покажем ещё раз в следующий заход */
    }
    root.classList.add('is-preload-leaving');
    root.classList.remove('is-preloading');
    setTimeout(() => {
      root.classList.remove('is-preload-leaving');
      el.remove();
    }, 900);
  };

  // кадр анимации, а если браузер их не даёт (вкладка в фоне) — обычный таймер
  const next = (fn) => {
    let fired = false;
    const raf = requestAnimationFrame((t) => {
      fired = true;
      fn(t);
    });
    setTimeout(() => {
      if (fired) return;
      cancelAnimationFrame(raf);
      fn(performance.now());
    }, 100);
  };

  const tick = (now) => {
    if (start === null) start = now;
    const elapsed = now - start;
    let p = ease(Math.min(1, elapsed / DURATION));
    // страница ещё грузится — держим счётчик на 96% до события load
    if (!loaded && elapsed < MAX_WAIT) p = Math.min(p, 0.96);
    show(p);
    if (p < 1) return next(tick);
    setTimeout(finish, 220);
  };
  next(tick);
})();

/* ---------- Год в подвале ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ---------- Мобильное меню ---------- */
(function initMenu() {
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  if (!burger || !menu) return;

  const setOpen = (open) => {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('is-locked', open);
  };

  burger.addEventListener('click', () => setOpen(menu.hidden));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      burger.focus();
    }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
})();

/* ---------- Аккордеоны ---------- */
document.querySelectorAll('[data-accordion]').forEach((acc) => {
  acc.addEventListener('click', (e) => {
    const head = e.target.closest('.acc__head');
    if (!head || !acc.contains(head)) return;
    const item = head.parentElement;
    const willOpen = !item.classList.contains('is-open');

    acc.querySelectorAll('.acc__item.is-open').forEach((opened) => {
      opened.classList.remove('is-open');
      opened.querySelector('.acc__head').setAttribute('aria-expanded', 'false');
    });

    if (willOpen) {
      item.classList.add('is-open');
      head.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ---------- Появление блоков при прокрутке ---------- */
(function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // соседние блоки в одном ряду появляются по очереди
  const groups = new Map();
  items.forEach((el) => {
    const parent = el.parentElement;
    const index = groups.get(parent) || 0;
    el.style.setProperty('--d', `${Math.min(index, 5) * 0.08}s`);
    groups.set(parent, index + 1);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  items.forEach((el) => io.observe(el));
})();

/* ---------- Манифест: слова проявляются по мере прокрутки ---------- */
(function initStatement() {
  const el = document.getElementById('statement');
  if (!el || reduceMotion) return;

  // оборачиваем каждое слово в span, сохраняя <em>
  const wrapWords = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/( +)/).forEach((part) => {
          if (!part) return;
          if (/^ +$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrapWords(child);
      }
    });
  };
  wrapWords(el);

  const words = [...el.querySelectorAll('.w')];
  let ticking = false;

  const update = () => {
    ticking = false;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = clamp((vh * 0.88 - rect.top) / (rect.height + vh * 0.38), 0, 1);
    const head = progress * (words.length + 1);
    words.forEach((w, i) => {
      w.style.opacity = String(0.16 + 0.84 * clamp(head - i, 0, 1));
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- Граф на первом экране ---------- */
(function initGraph() {
  const canvas = document.getElementById('graph');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const INK = '13, 15, 14';
  const ACCENT = '#1a8754';

  // основной маршрут проекта (координаты в долях от размера холста)
  const main = [
    { x: 0.13, y: 0.14, label: 'идея', side: 'top' },
    { x: 0.50, y: 0.09, label: 'аналитика' },
    { x: 0.80, y: 0.30, label: 'дизайн' },
    { x: 0.34, y: 0.47, label: 'разработка' },
    { x: 0.74, y: 0.67, label: 'тесты' },
    { x: 0.30, y: 0.87, label: 'релиз', final: true },
  ];
  // фоновые узлы
  const minor = [
    { x: 0.31, y: 0.26 }, { x: 0.63, y: 0.22 }, { x: 0.93, y: 0.11 },
    { x: 0.08, y: 0.38 }, { x: 0.93, y: 0.50 },
    { x: 0.14, y: 0.64 }, { x: 0.52, y: 0.76 }, { x: 0.90, y: 0.86 },
    { x: 0.07, y: 0.92 }, { x: 0.60, y: 0.95 },
  ];

  const nodes = [...main, ...minor].map((n, i) => ({
    ...n,
    isMain: i < main.length,
    phase: i * 1.7 + 0.5,
    speed: 0.35 + ((i * 37) % 10) / 28,
    amp: i < main.length ? 5 : 9,
    px: 0, py: 0, // текущее положение в пикселях
    ox: 0, oy: 0, // смещение от курсора
  }));

  // фоновые связи: каждый малый узел соединён с двумя ближайшими
  const links = [];
  nodes.forEach((a, i) => {
    if (a.isMain) return;
    nodes
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
      .forEach((o) => links.push([i, o.j]));
  });

  let w = 0;
  let h = 0;
  let dpr = 1;
  const pointer = { x: -9999, y: -9999 };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (reduceMotion) draw(0);
  };

  const CYCLE = 9; // секунд на один проход от идеи до релиза
  const TRAVEL = 0.74; // доля цикла, пока импульс в пути

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // положение узлов
    nodes.forEach((n) => {
      const drift = reduceMotion ? 0 : 1;
      let x = n.x * w + Math.sin(t * n.speed + n.phase) * n.amp * drift;
      let y = n.y * h + Math.cos(t * n.speed * 0.8 + n.phase) * n.amp * drift;

      // узлы слегка расступаются перед курсором
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const force = clamp(1 - dist / 150, 0, 1);
      const tx = (dx / dist) * force * 22;
      const ty = (dy / dist) * force * 22;
      n.ox += (tx - n.ox) * 0.1;
      n.oy += (ty - n.oy) * 0.1;

      n.px = x + n.ox;
      n.py = y + n.oy;
    });

    // фоновые связи
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${INK}, 0.13)`;
    ctx.beginPath();
    links.forEach(([a, b]) => {
      ctx.moveTo(nodes[a].px, nodes[a].py);
      ctx.lineTo(nodes[b].px, nodes[b].py);
    });
    ctx.stroke();

    // основной маршрут
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(${INK}, 0.85)`;
    ctx.beginPath();
    main.forEach((_, i) => {
      const n = nodes[i];
      if (i === 0) ctx.moveTo(n.px, n.py);
      else ctx.lineTo(n.px, n.py);
    });
    ctx.stroke();

    // импульс: проходит маршрут, задерживается на релизе, затем гаснет
    const segs = main.length - 1;
    const phase = reduceMotion ? TRAVEL : (t % CYCLE) / CYCLE;
    const travel = clamp(phase / TRAVEL, 0, 1);
    const eased = travel * travel * (3 - 2 * travel);
    const pos = eased * segs;
    const fade = phase > 0.92 ? 1 - (phase - 0.92) / 0.08 : 1;
    const seg = Math.min(Math.floor(pos), segs - 1);
    const k = pos - seg;
    const from = nodes[seg];
    const to = nodes[seg + 1];
    const hx = from.px + (to.px - from.px) * k;
    const hy = from.py + (to.py - from.py) * k;

    ctx.globalAlpha = fade;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ACCENT;
    ctx.beginPath();
    ctx.moveTo(nodes[0].px, nodes[0].py);
    for (let i = 1; i <= seg; i++) ctx.lineTo(nodes[i].px, nodes[i].py);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    if (travel < 1) {
      ctx.fillStyle = 'rgba(26, 135, 84, 0.18)';
      ctx.beginPath();
      ctx.arc(hx, hy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // малые узлы
    nodes.forEach((n) => {
      if (n.isMain) return;
      ctx.fillStyle = `rgba(${INK}, 0.32)`;
      ctx.beginPath();
      ctx.arc(n.px, n.py, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // главные узлы и подписи
    const fontSize = w < 420 ? 10.5 : 12;
    ctx.font = `500 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.06em';

    main.forEach((m, i) => {
      const n = nodes[i];
      const reached = pos >= i - 0.02 ? fade : 0;
      const r = m.final ? 11 : 7.5;

      if (m.final && reached > 0 && travel >= 1) {
        // кольцо расходится от «релиза», когда импульс дошёл
        const ring = clamp((phase - TRAVEL) / (0.92 - TRAVEL), 0, 1);
        ctx.strokeStyle = `rgba(26, 135, 84, ${(1 - ring) * 0.6 * fade})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.px, n.py, r + ring * 34, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#f4f5f3';
      ctx.strokeStyle = `rgb(${INK})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (reached > 0) {
        ctx.globalAlpha = reached;
        ctx.fillStyle = ACCENT;
        ctx.beginPath();
        ctx.arc(n.px, n.py, m.final ? r : r - 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const label = m.label.toUpperCase();
      ctx.fillStyle = `rgb(${INK})`;
      if (m.side === 'top') {
        ctx.textAlign = 'center';
        ctx.fillText(label, n.px, n.py - r - 14);
      } else {
        const toLeft = m.x > 0.62;
        ctx.textAlign = toLeft ? 'right' : 'left';
        ctx.fillText(label, n.px + (toLeft ? -(r + 10) : r + 10), n.py + 1);
      }
    });
  }

  let running = false;
  let rafId = 0;
  const loop = (ms) => {
    if (!running) return;
    draw(ms / 1000);
    rafId = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || reduceMotion) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  resize();

  if (reduceMotion) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(0));
    return;
  }

  // анимация идёт только пока граф виден
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    }).observe(canvas);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (canvas.getBoundingClientRect().bottom > 0) start();
  });
})();

/* ---------- Формы: заявка (#brief) и приглашение в тендер (#tender-form) ----------
   Обе отправляют JSON на CONFIG.formEndpoint (приём заявок CRM), а без него открывают письмо. */
(function initLeadForms() {
  const forms = document.querySelectorAll('form[data-lead-form]');
  if (!forms.length) return;
  const emailLink = document.getElementById('contact-email');
  const email = CONFIG.email || (emailLink ? emailLink.getAttribute('href').replace(/^mailto:/, '') : '');

  const setFieldError = (input, message) => {
    const field = input.closest('.field');
    let hint = field.querySelector('.field__error');
    field.classList.toggle('is-error', Boolean(message));
    if (message) {
      if (!hint) {
        hint = document.createElement('p');
        hint.className = 'field__error';
        hint.id = `${input.id}-error`;
        field.appendChild(hint);
      }
      hint.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', hint.id);
    } else {
      if (hint) hint.remove();
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  };

  const REQUIRED = {
    company: 'Укажите компанию',
    name: 'Напишите, как к вам обращаться',
    contact: 'Оставьте контакт, чтобы мы могли ответить',
  };

  forms.forEach((form) => {
    const kind = form.dataset.leadForm; // 'brief' | 'tender'
    const status = form.querySelector('.form__status');
    const setStatus = (text, isError) => {
      status.textContent = text;
      status.classList.toggle('is-error', Boolean(isError));
    };
    const val = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');

    form.addEventListener('input', (e) => {
      if (e.target.matches('.field input') && e.target.value.trim()) setFieldError(e.target, '');
    });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'consent' && e.target.checked) setFieldError(e.target, '');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('');
      let firstInvalid = null;

      for (const [n, message] of Object.entries(REQUIRED)) {
        const input = form.elements[n];
        if (!input || !input.required) continue;
        const empty = !input.value.trim();
        setFieldError(input, empty ? message : '');
        if (empty && !firstInvalid) firstInvalid = input;
      }
      // согласие на обработку персональных данных — отдельное и обязательное (152-ФЗ)
      const consent = form.elements.consent;
      if (consent) {
        setFieldError(consent, consent.checked ? '' : 'Без согласия на обработку персональных данных мы не сможем принять заявку');
        if (!consent.checked && !firstInvalid) firstInvalid = consent;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const isTender = kind === 'tender';
      const about = isTender
        ? [
            `Компания: ${val('company')}`,
            val('link') ? `Закупка: ${val('link')}` : '',
            val('deadline') ? `Срок подачи: ${val('deadline').split('-').reverse().join('.')}` : '',
            val('about') ? `\n${val('about')}` : '',
          ].filter(Boolean).join('\n')
        : val('about');

      const data = {
        name: val('name'),
        company: isTender ? val('company') : undefined,
        contact: val('contact'),
        types: isTender ? ['Тендер'] : [...form.querySelectorAll('input[name="type"]:checked')].map((i) => i.value),
        about,
        source: isTender ? 'Тендер' : undefined,
        consent: Boolean(consent?.checked),
        consent_at: new Date().toISOString(),
      };
      const done = isTender
        ? 'Спасибо! Приглашение получено — ответим в течение рабочего дня.'
        : 'Спасибо! Заявка отправлена — ответим в течение рабочего дня.';

      // 1) если задан адрес приёма заявок — отправляем туда
      if (CONFIG.formEndpoint) {
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        setStatus('Отправляем…');
        try {
          const res = await fetch(CONFIG.formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          setStatus(done);
        } catch (err) {
          setStatus(`Не получилось отправить. Напишите нам на ${email}.`, true);
        } finally {
          button.disabled = false;
        }
        return;
      }

      // 2) иначе открываем почтовую программу с готовым письмом
      const body = [
        `Имя: ${data.name}`,
        `Контакт: ${data.contact}`,
        data.types.length && !isTender ? `Что нужно: ${data.types.join(', ')}` : '',
        data.about ? `\n${isTender ? '' : 'О проекте:\n'}${data.about}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const subject = isTender ? 'Приглашение в тендер' : 'Заявка с сайта';
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus(`Открыли письмо в вашей почтовой программе. Если оно не появилось — напишите на ${email}.`);
    });
  });
})();

/* ---------- Линия под шапкой при прокрутке ---------- */
(function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ---------- Уведомление о cookie ----------
   Выбор хранится в localStorage (ключ vecode-cookie-consent): 'all' или 'necessary'.
   Аналитику (например, Яндекс.Метрику) подключать только так:
     window.vecodeConsent.onChange((choice) => { if (choice === 'all') loadMetrika(); });
*/
(function initCookies() {
  const KEY = 'vecode-cookie-consent';
  const VERSION = 1; // увеличьте, если поменяется состав cookie — уведомление покажется снова
  const banner = document.getElementById('cookie-banner');
  const listeners = [];

  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.version === VERSION ? v.choice : null;
    } catch {
      return null;
    }
  };
  const save = (choice) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, version: VERSION, at: new Date().toISOString() }));
    } catch {
      /* приватный режим: выбор действует до закрытия вкладки */
    }
    listeners.forEach((fn) => fn(choice));
  };

  window.vecodeConsent = {
    get: read,
    onChange(fn) {
      listeners.push(fn);
      const current = read();
      if (current) fn(current);
    },
  };

  if (!banner) return;
  const show = () => {
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add('is-in'));
  };
  const hide = () => {
    banner.classList.remove('is-in');
    setTimeout(() => (banner.hidden = true), reduceMotion ? 0 : 300);
  };

  if (!read()) setTimeout(show, 600);

  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cookie]');
    if (!btn) return;
    save(btn.dataset.cookie === 'all' ? 'all' : 'necessary');
    hide();
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cookie-settings]')) show();
  });
})();
