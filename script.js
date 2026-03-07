const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const setHtml = (id, html) => {
  const el = $(id);
  if (!el) return;
  el.innerHTML = html;
  el.classList.remove('skeleton');
  el.removeAttribute('style');
};

class Scrollbar {
  constructor(container, trackId, thumbId) {
    this.container = container;
    this.isWindow = container === window;
    this.track = $(trackId);
    this.thumb = $(thumbId);
    this.isDragging = false;
    this.init();
  }

  update() {
    const st = this.isWindow ? window.scrollY : this.container.scrollTop;
    const sh = this.isWindow ? document.documentElement.scrollHeight : this.container.scrollHeight;
    const ch = this.isWindow ? window.innerHeight : this.container.clientHeight;
    const th = this.track.clientHeight;

    if (sh <= ch) {
      this.thumb.style.display = 'none';
      return;
    }
    this.thumb.style.display = 'block';

    const h = Math.max((ch / sh) * th, 40);
    const top = (st / (sh - ch)) * (th - h);

    this.thumb.style.height = `${h}px`;
    this.thumb.style.transform = `translateY(${top}px)`;
    this.thumb.classList.add('is-active');
    
    clearTimeout(this.hideTimeout);
    if (!this.isDragging) this.hideTimeout = setTimeout(() => this.thumb.classList.remove('is-active'), 800);
  }

  init() {
    this.thumb.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.startY = e.clientY;
      this.startTop = this.isWindow ? window.scrollY : this.container.scrollTop;
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
      if (!this.isDragging) return;
      const sh = this.isWindow ? document.documentElement.scrollHeight : this.container.scrollHeight;
      const ch = this.isWindow ? window.innerHeight : this.container.clientHeight;
      const maxT = this.track.clientHeight - Math.max((ch / sh) * this.track.clientHeight, 40);
      const delta = ((e.clientY - this.startY) / maxT) * (sh - ch);
      this.isWindow ? window.scrollTo(0, this.startTop + delta) : (this.container.scrollTop = this.startTop + delta);
    });
    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.style.userSelect = '';
        this.update();
      }
    });
    this.container.addEventListener('scroll', () => this.update(), { passive: true });
    window.addEventListener('resize', () => this.update());
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        o.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  $$('.reveal').forEach(el => obs.observe(el));

  const sMain = new Scrollbar(window, 'main-track', 'main-thumb');
  const sPriv = new Scrollbar($('privacy-scroll-area'), 'privacy-track', 'privacy-thumb');
  const sTerm = new Scrollbar($('terms-scroll-area'), 'terms-track', 'terms-thumb');

  const closeMenu = () => {
    $('mobile-menu').classList.remove('is-active');

    if (!$('modal-privacy').classList.contains('is-active') && !$('modal-terms').classList.contains('is-active')) {
      document.body.style.overflow = '';
      $('main-track').classList.remove('is-hidden');
    }
  };

  $('burger-btn').addEventListener('click', () => {
    $('mobile-menu').classList.add('is-active');
    document.body.style.overflow = 'hidden';
    $('main-track').classList.add('is-hidden');
  });

  $('mobile-close-btn').addEventListener('click', closeMenu);
  $$('.mobile-menu-link').forEach(l => l.addEventListener('click', closeMenu));

  const route = () => {
    const h = window.location.hash.substring(1);
    
    $('modal-privacy').classList.remove('is-active');
    $('modal-terms').classList.remove('is-active');

    if (!$('mobile-menu').classList.contains('is-active')) {
      document.body.style.overflow = '';
      $('main-track').classList.remove('is-hidden');
    }

    if (h === 'privacy' || h === 'terms') {
      document.body.style.overflow = 'hidden';
      $('main-track').classList.add('is-hidden');
      $(`modal-${h}`).classList.add('is-active');
      setTimeout(() => h === 'privacy' ? sPriv.update() : sTerm.update(), 50);
    }
  };

  window.addEventListener('hashchange', route);
  route();

  $$('.modal-back-btn').forEach(b => b.addEventListener('click', () => {
    history.pushState(null, null, window.location.pathname + window.location.search);
    route();
  }));

  fetch('settings.json').then(r => r.json()).then(d => {
    document.title = d.meta.title;
    $('meta-desc').content = d.meta.description;
    
    setHtml('ui-brand', d.brand);
    setHtml('nav-features', d.ui.navFeatures);
    setHtml('nav-compare', d.ui.navCompare);
    setHtml('nav-faq', d.ui.navFaq);
    setHtml('ui-btn-contact', d.ui.btnContact);
    
    setHtml('mob-features', d.ui.navFeatures);
    setHtml('mob-compare', d.ui.navCompare);
    setHtml('mob-pricing', d.ui.navPricing);
    setHtml('mob-faq', d.ui.navFaq);
    setHtml('mobile-close-btn', d.ui.btnMenuClose);

    setHtml('sec-features-title', d.sections.features);
    setHtml('sec-compare-title', d.sections.compare);
    setHtml('sec-faq-title', d.sections.faq);

    $$('.btn-modal-back .back-text').forEach(el => {
      el.textContent = d.ui.btnModalBack;
      el.classList.remove('skeleton');
      el.removeAttribute('style');
    });

    $$('.tg-link').forEach(el => el.href = d.telegramLink);

    setHtml('hero-title', d.hero.title);
    setHtml('hero-subtitle', d.hero.subtitle);
    setHtml('hero-badge', d.hero.badge);

    const fg = $('features-grid');
    fg.innerHTML = ''; 
    d.features.forEach(f => {
      fg.innerHTML += `<div class="feature-card glass-panel"><svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${f.iconPath}"></path></svg><div class="feature-title">${f.title}</div><div class="feature-text">${f.text}</div></div>`;
    });

    const cc = $('compare-container');
    let cHtml = `<div class="compare-row header"><div class="compare-title">${d.compare.col1}</div><div class="compare-title brand">${d.brand}</div><div class="compare-title">${d.compare.competitor}</div></div>`;
    d.compare.rows.forEach((r, i) => {
      cHtml += `<div class="compare-row" ${i === d.compare.rows.length - 1 ? 'style="border-bottom: none;"' : ''}><div class="compare-item">${r.label}</div><div class="compare-item ${r.us === "Да" ? "yes" : "no"}">${r.us}</div><div class="compare-item ${r.them === "Да" ? "yes" : "no"}">${r.them}</div></div>`;
    });
    cc.innerHTML = cHtml;
    cc.classList.remove('skeleton');

    setHtml('pricing-label', d.pricing.label);
    setHtml('pricing-amount', `${d.pricing.amount} <span>${d.pricing.period}</span>`);
    setHtml('pricing-btn', d.pricing.buttonText);
    const pl = $('pricing-features');
    pl.innerHTML = '';
    d.pricing.list.forEach(i => pl.innerHTML += `<li><svg class="pricing-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>${i}</li>`);

    const fw = $('faq-wrapper');
    fw.innerHTML = '';
    d.faq.forEach(i => fw.innerHTML += `<div class="faq-item"><button class="faq-btn"><span class="faq-question">${i.question}</span><svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button><div class="faq-content"><div class="faq-answer">${i.answer}</div></div></div>`);

    setHtml('ft-privacy', d.modals.privacyTitle);
    setHtml('ft-terms', d.modals.termsTitle);
    setHtml('footer-copy', d.footer.copyright);
    setHtml('privacy-content', `<h2>${d.modals.privacy.title}</h2>${d.modals.privacy.content}`);
    setHtml('terms-content', `<h2>${d.modals.terms.title}</h2>${d.modals.terms.content}`);

    setTimeout(() => sMain.update(), 100);
  });

  $('faq-wrapper').addEventListener('click', e => {
    const b = e.target.closest('.faq-btn');
    if (!b) return;
    const i = b.parentElement;
    const c = i.querySelector('.faq-content');
    const o = i.classList.contains('is-open');
    $$('.faq-item').forEach(x => { x.classList.remove('is-open'); x.querySelector('.faq-content').style.maxHeight = null; });
    if (!o) { i.classList.add('is-open'); c.style.maxHeight = c.scrollHeight + "px"; }
    setTimeout(() => sMain.update(), 300);
  });
});