/* ═══════════════════════════════════════════
   AgentLocal — landing scripts
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── 1. Language switcher (RU / EN) ─── */
  const STORAGE_KEY = 'agentlocal-lang';
  const langButtons = document.querySelectorAll('.lang__btn');

  const NOTES = {
    ru: {
      empty: 'Введите e-mail, чтобы мы могли связаться.',
      invalid: 'Похоже, в адресе опечатка. Проверьте, пожалуйста.',
      ok: 'Спасибо! Свяжемся с вами в течение рабочего дня.'
    },
    en: {
      empty: 'Enter your email so we can get in touch.',
      invalid: 'That address looks like a typo. Please check it.',
      ok: 'Thanks! We’ll get back to you within one business day.'
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

  /* ─── 2. Sticky header ─── */
  const header = document.getElementById('header');
  const onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── 3. Mobile menu ─── */
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

  /* ─── 4. Reveal on scroll ─── */
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

  /* ─── 5. Demo form ─── */
  const form = document.getElementById('demo-form');
  const email = document.getElementById('demo-email');
  const note = document.getElementById('form-note');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function say(kind, text) {
    note.textContent = text;
    note.className = 'cta__note ' + (kind === 'ok' ? 'is-ok' : 'is-error');
    email.classList.toggle('is-error', kind !== 'ok');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const value = email.value.trim();
    const t = NOTES[currentLang];

    if (!value) return say('error', t.empty);
    if (!EMAIL_RE.test(value)) return say('error', t.invalid);

    say('ok', t.ok);
    form.reset();
    // TODO: подключить реальный эндпоинт — fetch('/api/lead', { method: 'POST', body: ... })
  });

  email.addEventListener('input', function () {
    email.classList.remove('is-error');
    note.textContent = '';
  });

  /* ─── 6. Footer year ─── */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
