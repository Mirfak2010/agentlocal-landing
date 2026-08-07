/* ═══════════════════════════════════════════
   Rezaru — landing scripts
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── 1. Language switcher (RU / EN) ─── */
  const STORAGE_KEY = 'rezaru-lang';
  const langButtons = document.querySelectorAll('.lang__btn');

  const NOTES = {
    ru: {
      emptyName: 'Напишите, как к вам обращаться.',
      badPhone: 'Проверьте номер телефона — кажется, он неполный.',
      ok: 'Открываем Telegram — осталось нажать «Отправить».',
      // подписи полей в готовом сообщении
      title: 'Заявка с сайта Rezaru',
      fName: 'Имя',
      fPhone: 'Телефон',
      fTelegram: 'Telegram',
      fBusiness: 'Сфера',
      fMessage: 'Задача'
    },
    en: {
      emptyName: 'Tell us what to call you.',
      badPhone: 'Please check the phone number — it looks incomplete.',
      ok: 'Opening Telegram — just press “Send”.',
      title: 'Request from the Rezaru site',
      fName: 'Name',
      fPhone: 'Phone',
      fTelegram: 'Telegram',
      fBusiness: 'Business',
      fMessage: 'Task'
    }
  };

  let currentLang = 'ru';

  function setLang(lang) {
    currentLang = lang === 'en' ? 'en' : 'ru';

    document.querySelectorAll('[data-' + currentLang + ']').forEach(function (el) {
      const value = el.dataset[currentLang];
      if (el.tagName === 'META') el.setAttribute('content', value);
      else el.textContent = value;
    });

    document.querySelectorAll('[data-' + currentLang + '-ph]').forEach(function (el) {
      el.placeholder = el.dataset[currentLang + 'Ph'];
    });

    document.querySelectorAll('[data-' + currentLang + '-title]').forEach(function (el) {
      el.title = el.dataset[currentLang + 'Title'];
      el.setAttribute('aria-label', el.dataset[currentLang + 'Title']);
    });

    document.documentElement.lang = currentLang;
    langButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.lang === currentLang);
    });

    try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) { /* private mode */ }
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.dataset.lang); });
  });

  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
  const browserIsRu = (navigator.language || '').toLowerCase().indexOf('ru') === 0;
  setLang(saved || (browserIsRu ? 'ru' : 'en'));

  /* ─── 2. Theme (dark / light) ─── */
  const THEME_KEY = 'rezaru-theme';
  const themeToggle = document.getElementById('theme-toggle');

  function setTheme(theme, remember) {
    const value = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = value;
    themeToggle.setAttribute('aria-pressed', value === 'light');
    if (remember) {
      try { localStorage.setItem(THEME_KEY, value); } catch (e) { /* private mode */ }
    }
  }

  let savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) { /* private mode */ }

  // Первый заход — уважаем настройку системы, дальше решает выбор пользователя.
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  setTheme(savedTheme || (prefersLight ? 'light' : 'dark'), false);

  themeToggle.addEventListener('click', function () {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', true);
  });

  /* ─── 3. Sticky header ─── */
  const header = document.getElementById('header');
  const onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── 4. Mobile menu ─── */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  burger.addEventListener('click', function () {
    burger.classList.toggle('is-open');
    nav.classList.toggle('is-open');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      burger.classList.remove('is-open');
      nav.classList.remove('is-open');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      burger.classList.remove('is-open');
      nav.classList.remove('is-open');
    }
  });

  /* ─── 5. Reveal on scroll ─── */
  const revealables = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealables.forEach(function (el, i) {
      // slight stagger for siblings inside the same grid
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ─── 6. Demo form → Telegram ─── */

  // Кому уходит заявка — без «@». Сторонних сервисов и почты в коде нет:
  // форма собирает текст и открывает чат с уже готовым сообщением.
  const TELEGRAM_TARGET = 'mirfak_0';

  const form = document.getElementById('demo-form');
  const note = document.getElementById('form-note');
  const fieldName = document.getElementById('lead-name');
  const fieldPhone = document.getElementById('lead-phone');
  const fieldTelegram = document.getElementById('lead-telegram');
  const fieldBusiness = document.getElementById('lead-business');
  const fieldMessage = document.getElementById('lead-message');

  function say(kind, text) {
    note.textContent = text;
    note.className = 'lead__note' + (kind === 'plain' ? '' : kind === 'ok' ? ' is-ok' : ' is-error');
  }

  function fail(field, text) {
    field.classList.add('is-error');
    field.focus();
    say('error', text);
  }

  function buildMessage(t) {
    const lines = [t.title, ''];
    const add = function (label, value) {
      if (value) lines.push(label + ': ' + value);
    };

    add(t.fName, fieldName.value.trim());
    add(t.fPhone, fieldPhone.value.trim());
    add(t.fTelegram, fieldTelegram.value.trim());
    add(t.fBusiness, fieldBusiness.value);
    add(t.fMessage, fieldMessage.value.trim());

    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const t = NOTES[currentLang];

    const name = fieldName.value.trim();
    const phone = fieldPhone.value.trim();

    if (name.length < 2) return fail(fieldName, t.emptyName);
    if (phone.replace(/\D/g, '').length < 10) return fail(fieldPhone, t.badPhone);

    const url = 'https://t.me/' + TELEGRAM_TARGET + '?text=' + encodeURIComponent(buildMessage(t));

    // Вызов синхронный внутри обработчика клика, поэтому блокировщик всплывающих
    // окон его пропускает. Если всё же не пропустил — уходим в том же окне.
    const opened = window.open(url, '_blank', 'noopener');
    if (!opened) window.location.href = url;

    say('ok', t.ok);
  });

  form.addEventListener('input', function (e) {
    e.target.classList.remove('is-error');
    if (note.textContent) say('plain', '');
  });

  /* ─── 7. Footer year ─── */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
