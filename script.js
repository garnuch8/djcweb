// [PKT 15] Modularyzacja - unikanie zmiennych globalnych poprzez zawinięcie logiki w IIFE
(function() {
  /* [PKT 7] Detekcja prefers-reduced-motion */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Inicjalizacja Lenis (Gładkie scrollowanie) - wyłączone jeśli zredukowany ruch */
  let lenis;
  if (!prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000) });
    gsap.ticker.lagSmoothing(0, 0);
  }

  /* [PKT 19] Automatyczna aktualizacja lat w layoucie */
  const currentYear = new Date().getFullYear();
  const startYear = 2019;
  const expYears = currentYear - startYear;
  
  if (document.getElementById('hero-year')) document.getElementById('hero-year').textContent = currentYear;
  if (document.getElementById('promo-year')) document.getElementById('promo-year').textContent = currentYear;
  if (document.getElementById('footer-year')) document.getElementById('footer-year').textContent = currentYear;
  if (document.getElementById('exp-counter')) document.getElementById('exp-counter').setAttribute('data-target', expYears);


  /* [PKT 1] Usunięcie sztucznego opóźnienia preloadera - wyświetlamy po pełnym załadowaniu zasobów okna */
  window.addEventListener('load', () => {
    const intro = document.getElementById('intro');
    const main = document.getElementById('main');
    
    if(!sessionStorage.getItem('introPlayed')) {
      sessionStorage.setItem('introPlayed', 'true');
      intro.classList.add('hide');
      intro.addEventListener('transitionend', () => { intro.style.display = 'none'; }, { once: true });
      main.classList.add('visible');
      if (!prefersReducedMotion) initGSAPAnimations();
    } else {
      intro.style.display = 'none';
      main.classList.add('visible');
      main.style.opacity = '1';
      if (!prefersReducedMotion) initGSAPAnimations();
    }
  });

  /* [PKT 6 & 16] Zarządzanie customowym kursorem + requestAnimationFrame (Throttling) */
  const cursor = document.getElementById('custom-cursor');
  const cursorBtn = document.getElementById('cursor-toggle');
  let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  let customCursorEnabled = sessionStorage.getItem('cursorDisabled') !== 'true';

  function updateCursorState() {
    if(customCursorEnabled && !isTouchDevice) {
      document.body.classList.add('custom-cursor-enabled');
      cursorBtn.textContent = 'Wyłącz customowy kursor';
    } else {
      document.body.classList.remove('custom-cursor-enabled');
      cursorBtn.textContent = 'Włącz customowy kursor';
    }
  }

  if(!isTouchDevice && window.matchMedia("(pointer: fine)").matches) {
    updateCursorState();
    let mouseX = 0, mouseY = 0;
    let isMoving = false;

    // [PKT 16] Optymalizacja z requestAnimationFrame
    document.addEventListener('mousemove', (e) => {
      if (!customCursorEnabled) return;
      mouseX = e.clientX; mouseY = e.clientY;
      
      if (!isMoving) {
        window.requestAnimationFrame(() => {
          cursor.style.left = mouseX + 'px'; cursor.style.top = mouseY + 'px';
          isMoving = false;
        });
        isMoving = true;
      }
      
      if(e.target.tagName === 'IFRAME' || e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO') {
        cursor.classList.add('hidden');
      } else {
        cursor.classList.remove('hidden');
      }
    });

    const HOVER_SELECTOR = 'a, button, input, textarea, summary, label, select, [role="button"], .quiz-opt, .scard, .genre-card, .gallery-slide-item, .faq-item summary, .cursor-btn';

    document.addEventListener('mouseover', (e) => {
      if (!customCursorEnabled) return;
      if (e.target.closest(HOVER_SELECTOR)) {
        cursor.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (!customCursorEnabled) return;
      const from = e.target.closest(HOVER_SELECTOR);
      const to = e.relatedTarget?.closest(HOVER_SELECTOR);
      if (from && !to) {
        cursor.classList.remove('hovering');
      }
    });

    cursorBtn.addEventListener('click', () => {
      customCursorEnabled = !customCursorEnabled;
      sessionStorage.setItem('cursorDisabled', (!customCursorEnabled).toString());
      updateCursorState();
    });
  } else {
    if(cursor) cursor.style.display = 'none';
    if(cursorBtn) cursorBtn.style.display = 'none';
  }

  /* Progress Ring & ScrollSpy logic */
  const nav = document.getElementById('nav');
  const heroLogoImg = document.querySelector('.hero-logo-image');
  const navLinks = document.querySelectorAll('.nav-links a:not(.btn-nav)');
  const circle = document.querySelector('.progress-ring__circle');
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;

  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;
  let lastScrollY = window.scrollY;
  let navDocked = false;

  function updateNavOnScroll(scrollY) {
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    document.getElementById('scroll-progress').style.width = (scrollY / height) * 100 + '%';
    circle.style.strokeDashoffset = circumference - (scrollY / height) * circumference;

    document.getElementById('scrollTopBtn').classList.toggle('visible', scrollY > 500);

    if (scrollY > 80) {
      if (!navDocked) {
        navDocked = true;
        nav.classList.add('scrolled');
        if (heroLogoImg) heroLogoImg.classList.add('fly-away');
      }
      if (scrollY > lastScrollY + 5) nav.classList.add('hide-nav');
      else if (scrollY < lastScrollY - 5) nav.classList.remove('hide-nav');
    } else {
      if (navDocked) {
        navDocked = false;
        nav.classList.remove('scrolled', 'hide-nav');
        if (heroLogoImg) heroLogoImg.classList.remove('fly-away');
      }
    }
    lastScrollY = scrollY;
  }

  if (lenis) {
    lenis.on('scroll', (e) => updateNavOnScroll(e.animatedScroll));
  } else {
    window.addEventListener('scroll', () => updateNavOnScroll(window.scrollY));
  }

  /* [PKT 5] Wydajniejszy ScrollSpy - IntersectionObserver zamiast pętli na scrollu */
  const sections = document.querySelectorAll('section[id]');
  const observerOptions = { rootMargin: '-50% 0px -50% 0px' };
  
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
          a.classList.remove('active');
          if (a.getAttribute('href') === '#' + entry.target.id) a.classList.add('active');
        });
      }
    });
  }, observerOptions);
  
  sections.forEach(sec => spyObserver.observe(sec));

  document.getElementById('scrollTopBtn').addEventListener('click', () => { 
    if (lenis) lenis.scrollTo(0, { duration: 1.5 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* Menu mobilne */
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinksContainer = document.getElementById('nav-links');

  mobileToggle.addEventListener('click', () => {
    const isOpen = navLinksContainer.classList.toggle('open');
    mobileToggle.setAttribute('aria-expanded', isOpen);
    mobileToggle.textContent = isOpen ? '✕' : '☰';
  });
    
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => { 
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      
      navLinksContainer.classList.remove('open'); 
      mobileToggle.textContent = '☰'; 
      mobileToggle.setAttribute('aria-expanded', 'false');
      
      if(targetEl) { 
        if(lenis) lenis.scrollTo(targetEl, { offset: -80 });
        else window.scrollTo({ top: targetEl.offsetTop - 80, behavior: 'smooth' });
      }
    });
  });

  /* [PKT 14] Lazy load hero video — ładuje się po załadowaniu strony, nie blokuje LCP */
  const heroVideo = document.getElementById('hero-video');
  const heroPoster = document.getElementById('hero-poster');
  const videoBtn = document.getElementById('video-toggle-btn');

  function loadHeroVideo() {
    if (!heroVideo || heroVideo.src) return;
    const src = heroVideo.getAttribute('data-src');
    if (!src) return;
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    heroVideo.appendChild(source);
    heroVideo.load();
    heroVideo.play().then(() => {
      heroVideo.style.opacity = '1';
      if (heroPoster) heroPoster.style.opacity = '0';
    }).catch(() => {});
  }

  /* Wczytaj wideo po 2s lub po pierwszej interakcji — cokolwiek nastąpi pierwsze */
  const videoLoadTimer = setTimeout(loadHeroVideo, 2000);
  ['mousemove','touchstart','scroll','keydown'].forEach(evt => {
    window.addEventListener(evt, () => { clearTimeout(videoLoadTimer); loadHeroVideo(); }, { once: true });
  });

  if(videoBtn && heroVideo) {
    videoBtn.addEventListener('click', () => {
      if (heroVideo.paused) {
        heroVideo.play();
        videoBtn.textContent = '⏸';
      } else {
        heroVideo.pause();
        videoBtn.textContent = '▶';
      }
    });
  }

  /* Animacje GSAP ScrollTrigger (Wywoływane tylko jeśli brak prefers-reduced-motion) */
  function initGSAPAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.gs-reveal').forEach(elem => {
      gsap.from(elem, { scrollTrigger: { trigger: elem, start: "top 85%" }, y: 50, opacity: 0, duration: 1, ease: "power3.out" });
    });
    gsap.utils.toArray('.gs-reveal-left').forEach(elem => {
      gsap.from(elem, { scrollTrigger: { trigger: elem, start: "top 85%" }, x: -50, opacity: 0, duration: 1, ease: "power3.out" });
    });
    gsap.utils.toArray('.gs-stagger').forEach(container => {
      const cards = container.querySelectorAll(':scope > div, :scope > img, :scope > details');
      gsap.from(cards, { scrollTrigger: { trigger: container, start: "top 85%" }, y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" });
    });
    /* [PKT 17] Liczniki — poprawna animacja przez obiekt pośredni */
    gsap.utils.toArray('.gs-counter').forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const obj = { val: 0 };
      gsap.to(obj, {
        scrollTrigger: { trigger: counter, start: 'top 88%' },
        val: target,
        duration: 2.2,
        ease: 'power2.out',
        onUpdate() {
          counter.textContent = Math.round(obj.val) + (target >= 100 ? '+' : '');
        },
        onComplete() {
          counter.textContent = target + (target >= 100 ? '+' : '');
        }
      });
    });
      gsap.utils.toArray('.gs-parallax').forEach(elem => {
        gsap.fromTo(elem,
          { y: 40, opacity: 0, scale: 0.97 },
          {
            scrollTrigger: {
              trigger: elem,
              start: "top 90%",
              end: "top 30%",
              scrub: 1.2
            },
            y: 0,
            opacity: 1,
            scale: 1,
            ease: "none"
          }
        );
      });

    /* [PKT 16] Galeria — 3D scroll entrance */
    gsap.fromTo('.gallery-swiper-outer',
      { rotateX: 5, scale: 0.97, opacity: 0.4 },
      {
        scrollTrigger: { trigger: '#galeria', start: 'top 82%', end: 'top 20%', scrub: 1 },
        rotateX: 0, scale: 1, opacity: 1, ease: 'none',
        transformPerspective: 900, transformOrigin: 'center top'
      }
    );
  }

  /* Swiper.js dla opinii */
  const swiper = new Swiper(".reviewSwiper", {
    slidesPerView: 1,
    spaceBetween: 30,
    loop: true,
    autoplay: prefersReducedMotion ? false : { delay: 4500, disableOnInteraction: true },
    pagination: { el: ".swiper-pagination", clickable: true },
    breakpoints: {
      768: { slidesPerView: 2 },
      1100: { slidesPerView: 3 }
    }
  });

  /* Vanilla Tilt dla kart oferty i opinii */
  function initTilt() {
    if (typeof VanillaTilt !== 'undefined' && !prefersReducedMotion) {
      VanillaTilt.init(document.querySelectorAll('.js-tilt'), { max: 5, speed: 400, glare: false });
    }
  }
  initTilt();

  /* Niestandardowy Odtwarzacz Audio */
  const audio = document.getElementById('dj-audio');
  const playBtn = document.getElementById('playBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const currentTimeEl = document.getElementById('currentTime');
  const durationTimeEl = document.getElementById('durationTime');
  const volumeSlider = document.getElementById('volumeSlider');
  const canvas = document.getElementById('audio-canvas');
  
  let audioCtx, analyser, source, dataArray, bufferLength;
  let isAudioInit = false;

  function formatTime(secs) {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  audio.addEventListener('loadedmetadata', () => { durationTimeEl.textContent = formatTime(audio.duration); });
  
  audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${percent}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    progressContainer.setAttribute('aria-valuenow', Math.round(percent));
  });

  // Ustawienie czasu utworu (klikniecie i klawiatura)
  function setProgress(x) {
    const width = progressContainer.clientWidth;
    const duration = audio.duration;
    if(duration) audio.currentTime = (x / width) * duration;
  }
  
  progressContainer.addEventListener('click', (e) => {
    setProgress(e.offsetX);
  });

  /* [PKT 8] Dostępność z poziomu klawiatury (Focus + Strzałki) */
  progressContainer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
       e.preventDefault();
       audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); // skok 5 sek w przód
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
       e.preventDefault();
       audio.currentTime = Math.max(0, audio.currentTime - 5); // skok 5 sek w tył
    } else if (e.key === ' ' || e.key === 'Enter') {
       e.preventDefault();
       playBtn.click();
    }
  });

  volumeSlider.addEventListener('input', (e) => { audio.volume = e.target.value; });

  playBtn.addEventListener('click', () => {
    if(!isAudioInit) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        if (!prefersReducedMotion) drawVisualizer();
      }
      isAudioInit = true;
    }
    
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    if(audio.paused) { audio.play(); playBtn.textContent = '⏸'; } 
    else { audio.pause(); playBtn.textContent = '▶'; }
  });

  function drawVisualizer() {
    if(!canvas || !audioCtx) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight; let x = 0;
    
    for(let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      ctx.fillStyle = `rgba(60, 168, 92, ${barHeight/150})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  /* Formularz kontaktowy & Cloudflare Turnstile */
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isFormValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
      input.classList.remove('is-invalid');
      if(input.value.trim() !== '') { input.classList.add('is-valid'); }
    });

    inputs.forEach(input => {
      if(!input.checkValidity()) { input.classList.add('is-invalid'); isFormValid = false; }
    });
    if(!isFormValid) return;

    const formData = new FormData(form);
    const turnstileResponse = formData.get('cf-turnstile-response');
    const msg = document.getElementById('form-msg');
    
    if(!turnstileResponse) {
       msg.style.color = '#e74c3c';
       msg.textContent = 'Proszę potwierdzić, że nie jesteś robotem.';
       return;
    }

    const btn = document.getElementById('form-btn');
    const btnText = btn.querySelector('.btn-text');
    
    btn.classList.add('loading'); 
    btnText.textContent = 'Wysyłanie...';
    msg.textContent = '';
    
    try {
      const response = await fetch(e.target.action, {
        method: form.method,
        body: formData,
        headers: { 'Accept': 'application/json' }
      });
      // [PKT 18] W zależności od endpointu tutaj należy sprawdzić logikę po stronie backendu Turnstile.
      if(response.ok) {
        msg.style.color = 'var(--accent-light)';
        msg.textContent = '✓ Dziękuję! Wiadomość wysłana pomyślnie.';
        form.reset();
        turnstile.reset(); 
        inputs.forEach(inp => inp.classList.remove('is-valid', 'is-invalid'));
      } else {
        throw new Error('Błąd wysyłania');
      }
    } catch(err) {
      msg.style.color = '#e74c3c';
      msg.textContent = 'Wystąpił błąd serwera. Spróbuj ponownie lub zadzwoń.';
    } finally {
      btn.classList.remove('loading');
      btnText.textContent = 'Wyślij zapytanie →';
    }
  });
// 3D Mouse-follow tilt for hero section
  const heroSection = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  
  if (heroSection && heroContent && !prefersReducedMotion) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      
      const rotX = -dy * 8;
      const rotY = dx * 8;
      
      heroContent.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0px)`;
      heroContent.style.transition = 'transform 0.1s ease-out';
    });
    
    heroSection.addEventListener('mouseleave', () => {
      heroContent.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      heroContent.style.transition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1)';
    });
  }

  /* ── Gallery Swiper + Lightbox + Parallax (pkt 16) ── */
  /* ── Gallery Swiper 3D (taśma filmowa) + Tilt na ruch myszy ── */
  const gallerySwiper = new Swiper('.gallerySwiper', {
    slidesPerView: 1.15,
    spaceBetween: 20,
    centeredSlides: true,
    loop: true,
    grabCursor: true,
    slideToClickedSlide: true,
    speed: 620,
    autoplay: prefersReducedMotion ? false : { delay: 4200, disableOnInteraction: true, pauseOnMouseEnter: true },
    pagination: { el: '.gallery-swiper-pagination', clickable: true },
    breakpoints: {
      600:  { slidesPerView: 1.6,  spaceBetween: 24 },
      900:  { slidesPerView: 2.2,  spaceBetween: 28 },
      1200: { slidesPerView: 2.8,  spaceBetween: 32 },
    },
    on: {
      slideChangeTransitionStart() {
        // reset inline tilt na wszystkich kartach przy zmianie slajdu
        document.querySelectorAll('.gallery-slide-item').forEach(card => {
          card.style.transition = 'transform 0.5s ease, box-shadow 0.4s ease, border-color 0.4s ease';
          card.style.transform = '';
        });
        document.querySelectorAll('.gallery-slide-img').forEach(img => {
          img.style.transition = 'filter 0.45s ease, transform 0.4s ease';
          img.style.transform  = '';
        });
      }
    }
  });

  /* Wire up manual prev/next buttons */
  document.getElementById('gallery-prev')?.addEventListener('click', () => gallerySwiper.slidePrev());
  document.getElementById('gallery-next')?.addEventListener('click', () => gallerySwiper.slideNext());

  /* ── 3D Tilt — ruch myszy na każdej karcie ── */
  if (!prefersReducedMotion) {
    const galleryWrapper = document.querySelector('.gallerySwiper');
    if (galleryWrapper) {

      galleryWrapper.addEventListener('mousemove', (e) => {
        const item = e.target.closest('.gallery-slide-item');
        if (!item) return;

        const r  = item.getBoundingClientRect();
        // normalizowane -1..+1
        const nx = ((e.clientX - r.left)  / r.width  - 0.5) * 2;
        const ny = ((e.clientY - r.top)   / r.height - 0.5) * 2;

        // aktywny slajd: pełny tilt 3D
        const slide = item.closest('.swiper-slide');
        const isActive = slide?.classList.contains('swiper-slide-active');

        const tiltX = isActive ?  ny * -12 : ny * -6;   // pochylenie góra/dół
        const tiltY = isActive ?  nx *  14 : nx *  6;   // pochylenie lewo/prawo
        const tz    = isActive ?  18        : 6;

        item.style.transition = 'transform 0.1s ease-out, box-shadow 0.2s ease, border-color 0.4s ease';
        item.style.transform  = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(${tz}px)`;

        // wewnątrz karty — obraz przesuwa się w przeciwną stronę (głębia)
        const img = item.querySelector('.gallery-slide-img');
        if (img) {
          img.style.transition = 'filter 0.45s ease, transform 0.12s ease-out';
          img.style.transform  = `translate(${nx * 10}px, ${ny * 7}px) scale(1.07)`;
        }

        // glow shadow zgodny z kierunkiem myszy
        if (isActive) {
          const sx = nx * 12;
          const sy = ny * 8;
          item.style.boxShadow = `
            ${-sx}px ${-sy}px 40px rgba(60,168,92,0.18),
            0 24px 70px rgba(0,0,0,0.7),
            0 0 0 1px rgba(80,200,120,0.3)
          `;
        }
      });

      // reset gdy kursor opuszcza kartę
      galleryWrapper.addEventListener('mouseout', (e) => {
        const item = e.target.closest('.gallery-slide-item');
        if (!item || item.contains(e.relatedTarget)) return;

        item.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.4s ease';
        item.style.transform  = '';
        item.style.boxShadow  = '';

        const img = item.querySelector('.gallery-slide-img');
        if (img) {
          img.style.transition = 'filter 0.45s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
          img.style.transform  = '';
        }
      });

      // zabezpieczenie gdy szybko wyjedziemy poza cały swiper
      galleryWrapper.addEventListener('mouseleave', () => {
        document.querySelectorAll('.gallery-slide-item').forEach(item => {
          item.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.4s ease';
          item.style.transform  = '';
          item.style.boxShadow  = '';
        });
        document.querySelectorAll('.gallery-slide-img').forEach(img => {
          img.style.transition = 'filter 0.45s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
          img.style.transform  = '';
        });
      });
    }
  }

  /* ── Lightbox ── */
  const lightbox   = document.getElementById('gallery-lightbox');
  const lbImg      = document.getElementById('lightbox-img');
  const lbCaption  = document.getElementById('lightbox-caption');
  const lbClose    = document.getElementById('lightbox-close');
  const lbBackdrop = lightbox?.querySelector('.lightbox-backdrop');

  function openLightbox(src, caption) {
    if (!lightbox) return;
    lbImg.src = src;
    lbImg.alt = caption;
    lbCaption.textContent = caption;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose?.focus();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  const galleryContainer = document.querySelector('.gallerySwiper');
  if (galleryContainer) {
    // Przypisanie atrybutów dostępności (tabindex, role) dla oryginalnych slajdów nadal jest przydatne
    document.querySelectorAll('.gallery-slide-item').forEach(item => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
    });

    // Delegowane kliknięcie (zadziała też na sklonowanych slajdach z loop: true)
    galleryContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-slide-item');
      if (item) {
        openLightbox(item.dataset.full, item.querySelector('.gallery-slide-label')?.textContent || '');
      }
    });

    // Delegowana obsługa z klawiatury (Enter / Spacja)
    galleryContainer.addEventListener('keydown', (e) => {
      const item = e.target.closest('.gallery-slide-item');
      if (item && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        openLightbox(item.dataset.full, item.querySelector('.gallery-slide-label')?.textContent || '');
      }
    });
  }

  lbClose?.addEventListener('click', closeLightbox);
  lbBackdrop?.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
  });

  if (!prefersReducedMotion) {
    const genreCards = document.querySelectorAll('.genre-card');
    genreCards.forEach((card, i) => {
      const rotDir = i < 2 ? -1 : 1;
      gsap.fromTo(card,
        { rotateY: rotDir * 20, rotateX: 10, opacity: 0, scale: 0.9 },
        {
          scrollTrigger: { trigger: card, start: 'top 88%' },
          rotateY: 0, rotateX: 0, opacity: 1, scale: 1,
          duration: 1.1, delay: i * 0.1, ease: 'power3.out'
        }
      );
    });

    // 3D mouse hover for genre cards
    genreCards.forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `perspective(600px) rotateX(${-dy * 10}deg) rotateY(${dx * 10}deg) translateZ(10px)`;
        card.style.transition = 'transform 0.1s ease-out';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)';
        card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      });
    });

    // 3D scard hover
    document.querySelectorAll('.scard:not(.review-card)').forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `perspective(600px) rotateX(${-dy * 7}deg) rotateY(${dx * 7}deg) translateZ(8px)`;
        card.style.transition = 'transform 0.1s ease-out, background 0.4s, border-color 0.4s';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)';
        card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1), background 0.4s, border-color 0.4s';
      });
    });
  }

  /* ── Quiz muzyczny ── */
  const quizAnswers = {};
  let currentStep = 1;
  const totalSteps = 3;

  const quizResults = {
    getResult(answers) {
      const { q1, q2, q3 } = answers;
      if (q1 === 'wesele' && q2 === 'elegancja') return {
        icon: '💍', title: 'Eleganckie Wesele',
        desc: 'Muzyka, która wzrusza i bawi jednocześnie. Zaczynamy od klasycznych ballad i walców, stopniowo budując energię aż do gorącego parkietu po północy.',
        genres: ['Ballady', 'Walce', 'Pop Klasyczny', 'Polskie Hity']
      };
      if (q1 === 'wesele' && q2 === 'szalenstwo') return {
        icon: '🔥', title: 'Wesele Non-Stop',
        desc: 'Parkiet wypełniony od pierwszego tańca do końca! Po walcu otwierającym przechodzimy płynnie w taneczne hity i nie zwalniamy aż do rana.',
        genres: ['Dance', 'House', 'Disco', 'Hity Dekad']
      };
      if (q1 === 'wesele') return {
        icon: '✨', title: 'Wesele z Klasą',
        desc: 'Perfekcyjny balans emocji i zabawy. Każdy moment ma swój klimat — wzruszenie przy pierwszym tańcu i szaleństwo przy oczepinach.',
        genres: ['Pop', 'Disco', 'Ballady', 'Latino']
      };
      if (q1 === 'urodziny' && q3 === 'mlodzi') return {
        icon: '🎉', title: 'Impreza Pokolenia',
        desc: 'Muzyka, którą znają wszyscy rówieśnicy. Najgorętsze aktualne hity przeplatane klasykami, przy których wszyscy śpiewają razem.',
        genres: ['Top 40', 'Hity 2020s', 'Alternatywa', 'R&B']
      };
      if (q1 === 'urodziny' && q3 === 'mixed') return {
        icon: '🎂', title: 'Urodziny dla Każdego',
        desc: 'Muzyka łącząca pokolenia — coś dla babci, coś dla mamy i coś dla Ciebie. Nikt nie będzie stać pod ścianą.',
        genres: ['Polskie Klasyki', 'Disco Polo', 'Pop', 'Biesiadne']
      };
      if (q1 === 'studniowka') return {
        icon: '🎓', title: 'Noc Studniówkowa',
        desc: 'Niezapomniana noc przed maturą. Od klasycznego walca angielskiego do tanecznych hitów — ta impreza będzie wspomnieniem na całe życie.',
        genres: ['Walc Angielski', 'Pop', 'Dance', 'Latino']
      };
      if (q1 === 'firmowy') return {
        icon: '🏢', title: 'Profesjonalny Event',
        desc: 'Muzyka tworząca odpowiednią atmosferę dla integracji firmowej — neutralna, przyjemna, ale wystarczająco energetyczna, by rozkręcić parkiet.',
        genres: ['Lounge', 'Pop', 'Jazz-Funk', 'Dance Classics']
      };
      return {
        icon: '🎵', title: 'Twój Unikalny Styl',
        desc: 'Każda impreza jest inna. Na podstawie Twoich odpowiedzi dobiorę repertuar idealnie skrojony pod Twoich gości i klimat eventu.',
        genres: ['Pop', 'Dance', 'Klasyki', 'Na żywo dobrane']
      };
    }
  };

  function goToStep(step) {
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    const next = document.querySelector(`.quiz-step[data-step="${step}"]`);
    if (next) {
      next.classList.add('active');
      currentStep = step;
      document.querySelectorAll('.quiz-dot').forEach(d => {
        d.classList.toggle('active', parseInt(d.dataset.dot) <= step);
      });
    }
  }

  function showResult() {
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    document.getElementById('quiz-progress').style.display = 'none';
    const result = quizResults.getResult(quizAnswers);
    document.getElementById('quiz-result-icon').textContent = result.icon;
    document.getElementById('quiz-result-title').textContent = result.title;
    document.getElementById('quiz-result-desc').textContent = result.desc;
    const genresEl = document.getElementById('quiz-result-genres');
    genresEl.innerHTML = result.genres.map(g => `<span>${g}</span>`).join('');
    const resultEl = document.getElementById('quiz-result');
    resultEl.style.display = 'block';
    resultEl.style.animation = 'fadeUp 0.6s ease forwards';
  }

  document.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.closest('.quiz-step').dataset.step);
      quizAnswers[`q${step}`] = btn.dataset.val;
      btn.closest('.quiz-options').querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setTimeout(() => {
        if (step < totalSteps) {
          goToStep(step + 1);
        } else {
          showResult();
        }
      }, 300);
    });
  });

  const restartBtn = document.getElementById('quiz-restart');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      Object.keys(quizAnswers).forEach(k => delete quizAnswers[k]);
      currentStep = 1;
      document.getElementById('quiz-result').style.display = 'none';
      document.getElementById('quiz-progress').style.display = 'flex';
      document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      document.querySelectorAll('.quiz-dot').forEach(d => d.classList.remove('active'));
      goToStep(1);
    });
  }

  /* ── PWA Service Worker ── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW zarejestrowany:', reg.scope))
        .catch(err => console.log('SW błąd:', err));
    });
  }

  /* ── Animacja wejścia kart opinii ── */
  const reviewCards = document.querySelectorAll('.review-card');
  if (reviewCards.length > 0 && !prefersReducedMotion) {
    const reviewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // kaskadowe opóźnienie
          const delay = Array.from(reviewCards).indexOf(entry.target) * 80;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          reviewObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reviewCards.forEach(card => reviewObserver.observe(card));
  } else {
    reviewCards.forEach(card => card.classList.add('visible'));
  }

  /* ── Magnetic button ── */
  if (!prefersReducedMotion) {
    document.querySelectorAll('.magnetic-wrap').forEach(wrap => {
      const btn = wrap.querySelector('.btn-primary');
      if (!btn) return;
      wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.35;
        const dy = (e.clientY - cy) * 0.35;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
        btn.style.transition = 'transform 0.15s ease-out';
      });
      wrap.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0,0)';
        btn.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      });
    });
  }

  /* ── Typing effect dla hero tag ── */
  const heroTag = document.querySelector('.hero-tag');
  if (heroTag && !prefersReducedMotion) {
    const text = heroTag.textContent;
    heroTag.textContent = '';
    heroTag.style.opacity = '1';
    let i = 0;
    const type = () => {
      if (i < text.length) {
        heroTag.textContent += text[i++];
        setTimeout(type, 38);
      }
    };
    // Start po intro (ok. 2.5s)
    setTimeout(type, 2500);
  }

})();