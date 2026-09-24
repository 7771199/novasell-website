/* NovaSell — vanilla JS, modular */
document.documentElement.classList.add('js');
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* Mobile menu + smooth scroll (smooth behavior set in CSS) */
const Menu = {
  init() {
    const burger = $('#burger'), menu = $('#menu');
    const close = () => { menu.classList.remove('open'); burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });
    $$('a', menu).forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => e.key === 'Escape' && close());
  }
};

/* Navbar shadow, active link, back-to-top */
const Scroll = {
  init() {
    const nav = $('#nav'), top = $('#totop');
    const links = $$('#menu a'), sections = links.map(a => $(a.getAttribute('href')));
    const onScroll = () => {
      nav.classList.toggle('scrolled', scrollY > 20);
      top.classList.toggle('show', scrollY > 600);
      const y = scrollY + 140;
      let cur = 0;
      sections.forEach((s, i) => { if (s && s.offsetTop <= y) cur = i; });
      if (innerHeight + scrollY >= document.body.scrollHeight - 4) cur = sections.length - 1;
      links.forEach((a, i) => a.classList.toggle('active', i === cur));
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  }
};

/* Scroll reveal */
const Reveal = {
  init() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) return items.forEach(el => el.classList.add('in'));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12 });
    items.forEach(el => io.observe(el));
  }
};

/* Testimonial slider (buttons, dots, swipe, autoplay) */
const Slider = {
  i: 0,
  init() {
    const track = $('#track'), slides = $$('.slide', track), dots = $('#dots');
    this.track = track; this.n = slides.length;
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      b.addEventListener('click', () => { this.go(i); this.play(); });
      dots.appendChild(b);
    });
    this.dots = $$('button', dots);
    $('#prev').addEventListener('click', () => { this.go(this.i - 1); this.play(); });
    $('#next').addEventListener('click', () => { this.go(this.i + 1); this.play(); });
    let x0 = null;
    track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { this.go(this.i + (dx < 0 ? 1 : -1)); this.play(); }
      x0 = null;
    });
    this.go(0); this.play();
  },
  go(i) {
    this.i = (i + this.n) % this.n;
    this.track.style.transform = `translateX(-${this.i * 100}%)`;
    this.dots.forEach((d, k) => d.classList.toggle('on', k === this.i));
  },
  play() {
    clearInterval(this.t);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) this.t = setInterval(() => this.go(this.i + 1), 6000);
  }
};

/* Contact form: validation + FormSubmit (delivers to the email in the form's action URL) */
const Form = {
  rules: {
    name: v => v.trim().length >= 2 || 'Please enter your full name.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
    phone: v => !v.trim() || /^[+\d\s().-]{7,20}$/.test(v.trim()) || 'Please enter a valid phone number.',
    service: v => !!v || 'Please choose a service.',
    message: v => v.trim().length >= 10 || 'Please write at least 10 characters.'
  },
  init() {
    const form = this.form = $('#form');
    this.status = $('#status'); this.btn = $('#submit');
    form.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    $$('input,select,textarea', form).forEach(f => f.addEventListener('blur', () => this.check(f)));
    /* Pricing buttons preselect the plan in the message box */
    $$('[data-plan]').forEach(a => a.addEventListener('click', () => {
      const m = $('#message'); if (!m.value) m.value = `I'm interested in the ${a.dataset.plan} plan. `;
    }));
  },
  check(f) {
    const rule = this.rules[f.name]; if (!rule) return true;
    const res = rule(f.value), ok = res === true, box = f.closest('.field');
    box.classList.toggle('bad', !ok);
    $('.err', box).textContent = ok ? '' : res;
    return ok;
  },
  setStatus(msg, type) { this.status.textContent = msg; this.status.className = 'status ' + (type || ''); },
  async submit() {
    const fields = $$('input,select,textarea', this.form).filter(f => this.rules[f.name]);
    const valid = fields.map(f => this.check(f)).every(Boolean);
    if (!valid) { this.setStatus('Please fix the highlighted fields.', 'fail'); fields.find(f => f.closest('.field').classList.contains('bad')).focus(); return; }
    const label = $('span', this.btn);
    this.btn.disabled = true; label.innerHTML = '<span class="spin"></span>Sending...'; this.setStatus('');
    try {
      const res = await fetch(this.form.action, { method: 'POST', body: new FormData(this.form), headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || res.status);
      this.form.reset(); this.setStatus('Thank you! Your message has been sent. We will reply soon.', 'ok');
    } catch (err) {
      this.setStatus('Sorry, your message could not be sent. Please try again or email us at support@novassells.com.', 'fail');
    } finally {
      this.btn.disabled = false; label.textContent = 'Send Message';
    }
  }
};

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  [Menu, Scroll, Reveal, Slider, Form].forEach(m => m.init());
});
