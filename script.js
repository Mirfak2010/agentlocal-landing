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
      emptyName: 'Напишите, как к вам обращаться.',
      badPhone: 'Проверьте номер телефона — кажется, он неполный.',
      consent: 'Отметьте согласие на обработку данных.',
      sending: 'Отправляем…',
      ok: 'Заявка отправлена. Свяжемся в течение рабочего дня.',
      fail: 'Не удалось отправить. Напишите нам в Telegram — ответим быстрее.',
      notConfigured: 'Форма пока не подключена: в script.js не указана почта для заявок.'
    },
    en: {
      emptyName: 'Tell us what to call you.',
      badPhone: 'Please check the phone number — it looks incomplete.',
      consent: 'Please agree to the processing of your data.',
      sending: 'Sending…',
      ok: 'Request sent. We’ll be in touch within one business day.',
      fail: 'Couldn’t send it. Message us on Telegram — we’ll reply faster.',
      notConfigured: 'The form isn’t connected yet: no destination email set in script.js.'
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

  /* ─── 5. Demo form → FormSubmit ─── */

  // Куда приходят заявки. Здесь либо почта, либо анонимный алиас FormSubmit
  // (выдаётся письмом после первой заявки — с ним почта не видна в коде сайта).
  const FORM_TARGET = 'mehron307@gmail.com';

  const TARGET_PLACEHOLDER = 'ЗАМЕНИТЕ-НА-ПОЧТУ';
  const ENDPOINT = 'https://formsubmit.co/ajax/' + encodeURIComponent(FORM_TARGET);

  const form = document.getElementById('demo-form');
  const note = document.getElementById('form-note');
  const fieldName = document.getElementById('lead-name');
  const fieldPhone = document.getElementById('lead-phone');
  const fieldConsent = document.getElementById('lead-consent');

  function say(kind, text) {
    note.textContent = text;
    note.className = 'lead__note' + (kind === 'plain' ? '' : kind === 'ok' ? ' is-ok' : ' is-error');
  }

  function fail(field, text) {
    field.classList.add('is-error');
    field.focus();
    say('error', text);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const t = NOTES[currentLang];

    // спам-ловушка: заполнить её может только бот
    if (form.elements._honey.value) return;

    if (FORM_TARGET === TARGET_PLACEHOLDER) return say('error', t.notConfigured);

    const name = fieldName.value.trim();
    const phone = fieldPhone.value.trim();

    if (name.length < 2) return fail(fieldName, t.emptyName);
    if (phone.replace(/\D/g, '').length < 10) return fail(fieldPhone, t.badPhone);
    if (!fieldConsent.checked) {
      fieldConsent.classList.add('is-error');
      return say('error', t.consent);
    }

    const payload = Object.fromEntries(new FormData(form).entries());

    form.classList.add('is-sending');
    say('plain', t.sending);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        // FormSubmit отдаёт success строкой — "false" тоже truthy, поэтому сравниваем явно
        if (String(data.success) !== 'true') throw new Error(data.message || 'rejected');
        say('ok', t.ok);
        form.reset();
      })
      .catch(function () { say('error', t.fail); })
      .then(function () { form.classList.remove('is-sending'); });
  });

  form.addEventListener('input', function (e) {
    e.target.classList.remove('is-error');
    if (note.textContent) say('plain', '');
  });

  /* ─── 6. Footer year ─── */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
