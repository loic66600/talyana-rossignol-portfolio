(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const body = document.body;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 700px)');
  const shortScreen = window.matchMedia('(max-height: 540px)');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const navigation = $('#navigation');
  const sequence = $('.hero-sequence');
  const stage = $('.hero-stage');
  const backstageArt = $('.backstage-art');
  const portrait = $('.hero-portrait');
  const cover = $('.cover-content');
  const backdrop = $('.cover-background');
  const spread = $('.editorial-spread');
  const progressBar = $('.chapter-line i');
  const chapters = $('.chapter-indicator');
  const menuToggle = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const main = $('main');
  const footer = $('footer');
  const lightbox = $('#lightbox');
  const infoDialog = $('#info-dialog');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (start, end, value) => {
    const x = clamp((value - start) / (end - start));
    return x * x * (3 - 2 * x);
  };
  const lerp = (a, b, amount) => a + (b - a) * amount;
  let progress = 0;
  let pendingFrame = false;
  let sequenceTop = 0;
  let sequenceDistance = 1;
  let stageHeight = stage.clientHeight;
  let menuOpen = false;
  let activeSection = 'accueil';
  let previousFocus = null;
  let activeGallery = [];
  let photoIndex = 0;
  let requestText = '';

  function syncLock() {
    body.classList.toggle('locked', menuOpen || lightbox.open || infoDialog.open);
  }

  function measure() {
    stageHeight = stage.clientHeight;
    sequenceTop = sequence.getBoundingClientRect().top + window.scrollY;
    sequenceDistance = Math.max(1, sequence.offsetHeight - stage.offsetHeight);
    // Match the marker to the source photo after object-fit, crop and zoom.
    if (backstageArt) {
      const w = backstageArt.clientWidth;
      const h = backstageArt.clientHeight;
      const fit = Math.max(w / 1013, h / 1800);
      const zoom = 1.08;
      const x = w / 2 + (535 * fit + (w - 1013 * fit) / 2 - w / 2) * zoom;
      const y = h / 2 + (785 * fit + (h - 1800 * fit) * .42 - h / 2) * zoom;
      Object.entries({ 'hand-x': x, 'hand-y': y, 'hand-rx': 92 * fit * zoom, 'hand-ry': 82 * fit * zoom }).forEach(([key, value]) => {
        backstageArt.style.setProperty(`--${key}`, `${value.toFixed(2)}px`);
      });
    }
    queueFrame();
  }

  function setMotion() {
    body.classList.toggle('motion-enabled', !motionPreference.matches);
    if (motionPreference.matches) {
      $$('.reveal').forEach(element => element.classList.add('is-visible'));
    }
    measure();
  }

  function updateHero() {
    const y = window.scrollY;
    const backstageBounds = backstageArt?.getBoundingClientRect();
    progress = motionPreference.matches || shortScreen.matches ? 0 : clamp((y - sequenceTop) / sequenceDistance);
    const transform = smooth(.06, .87, progress);
    const coverOpacity = 1 - smooth(.08, .42, progress);
    const spreadOpacity = smooth(.30, .76, progress);
    cover.style.opacity = coverOpacity.toFixed(4);
    cover.style.visibility = coverOpacity < .001 ? 'hidden' : 'visible';
    cover.inert = coverOpacity < .3;
    cover.setAttribute('aria-hidden', coverOpacity < .3 ? 'true' : 'false');
    backdrop.style.opacity = (1 - transform).toFixed(4);
    spread.style.opacity = spreadOpacity.toFixed(4);
    spread.style.visibility = spreadOpacity > .001 ? 'visible' : 'hidden';
    spread.inert = spreadOpacity < .7;
    spread.setAttribute('aria-hidden', spreadOpacity < .7 ? 'true' : 'false');
    const width = window.innerWidth;
    // Keep the portrait centered at both ends of the existing scroll transition.
    let start = width > 1150 ? [20,6,60,102] : width > 900 ? [17,7,66,99] : [15,10,70,94];
    let end = [36,21,28,62];
    if (narrow.matches) {
      start = [0,24,100,65];
      end = [28,32,44,49];
    }
    const portraitBox = start.map((value, index) => lerp(value, end[index], transform));
    ['left','top','width','height'].forEach((property, index) => {
      portrait.style[property] = portraitBox[index].toFixed(4) + '%';
    });
    if (width > 700 && width <= 1150) {
      // Keep the surname below the face throughout the scroll transition.
      const imageHeight = Math.min(width * portraitBox[2] / 100 * 1402 / 1122, stageHeight * portraitBox[3] / 100);
      const imageTop = stageHeight * (portraitBox[1] + portraitBox[3]) / 100 - imageHeight;
      const belowFace = imageTop + imageHeight * 500 / 1402 + 20;
      const belowTitle = (width > 900 ? 131 : 145) + width * .188 * .77 + 18;
      stage.style.setProperty('--surname-top', `${Math.max(belowFace, belowTitle).toFixed(2)}px`);
    }
    portrait.style.backgroundColor = `rgba(20, 18, 17, ${transform.toFixed(4)})`;
    portrait.style.setProperty('--portrait-shade', 1 - transform);
    progressBar.style.transform = `scaleX(${progress})`;
    chapters.style.color = transform > .5 ? '#635348' : '#d9c4ad';
    navigation.classList.toggle('scrolled', y > 40);
    navigation.classList.toggle('on-paper', !menuOpen && ((activeSection === 'accueil' && transform > .5) || ['univers','portfolio','apropos'].includes(activeSection)));
    if (progress > .05 || motionPreference.matches) {
      portrait.style.setProperty('--mouse-x', '0px');
      portrait.style.setProperty('--mouse-y', '0px');
    }
    if (backstageBounds && backstageBounds.bottom > 0 && backstageBounds.top < window.innerHeight) {
      const travel = clamp((window.innerHeight - backstageBounds.top) / (window.innerHeight + backstageBounds.height));
      const distance = narrow.matches ? 7 : 12;
      const shift = motionPreference.matches ? 0 : lerp(distance, -distance, travel);
      backstageArt.style.setProperty('--backstage-shift', `${shift.toFixed(2)}px`);
    }
    pendingFrame = false;
  }

  function queueFrame() {
    if (!pendingFrame) {
      pendingFrame = true;
      window.requestAnimationFrame(updateHero);
    }
  }

  window.addEventListener('scroll', queueFrame, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  motionPreference.addEventListener('change', setMotion);
  narrow.addEventListener('change', () => {
    if (!narrow.matches && menuOpen) setMenu(false);
    measure();
  });
  stage.addEventListener('pointermove', event => {
    if (!hover.matches || narrow.matches || motionPreference.matches || progress > .05) return;
    portrait.style.setProperty('--mouse-x', `${(event.clientX / window.innerWidth - .5) * 8}px`);
    portrait.style.setProperty('--mouse-y', `${(event.clientY / window.innerHeight - .5) * 4}px`);
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    portrait.style.setProperty('--mouse-x', '0px');
    portrait.style.setProperty('--mouse-y', '0px');
  });

  function setMenu(open, restoreFocus = true) {
    menuOpen = open;
    mobileMenu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    body.classList.toggle('menu-is-open', open);
    main.inert = open;
    footer.inert = open;
    syncLock();
    if (open) $('a', mobileMenu).focus();
    else if (restoreFocus) menuToggle.focus();
    queueFrame();
  }
  menuToggle.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', mobileMenu).forEach(link => link.addEventListener('click', () => {
    setMenu(false, false);
    const destination = $(link.getAttribute('href'));
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
      destination.addEventListener('blur', () => destination.removeAttribute('tabindex'), { once: true });
    }
  }));
  $('.brand').addEventListener('click', () => { if (menuOpen) setMenu(false, false); });
  document.addEventListener('keydown', event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') { setMenu(false); return; }
    if (event.key === 'Tab') {
      const items = [$('.brand'), menuToggle, ...$$('a', mobileMenu)];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .06, rootMargin: '0px 0px -20px 0px' });
    $$('.reveal').forEach(element => revealObserver.observe(element));
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        activeSection = entry.target.id;
        $$('.desktop-nav a').forEach(link => {
          if (link.getAttribute('href') === `#${activeSection}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
        queueFrame();
      });
    }, { rootMargin: '-12% 0px -75% 0px', threshold: 0 });
    $$('main>section').forEach(section => sectionObserver.observe(section));
  } else {
    $$('.reveal').forEach(element => element.classList.add('is-visible'));
  }

  const filmTrack = $('#film-track');
  const filmVideos = $$('.film-screen video');
  // A poster request is independent of preload="none". Wait until its film is near.
  const loadFilmPoster = video => {
    if (!video.dataset.poster) return;
    const pixels = video.getBoundingClientRect().width * (window.devicePixelRatio || 1);
    video.poster = pixels > 384 ? video.dataset.posterLarge : video.dataset.poster;
    delete video.dataset.poster;
    delete video.dataset.posterLarge;
  };
  if ('IntersectionObserver' in window) {
    const posterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        loadFilmPoster(entry.target);
        posterObserver.unobserve(entry.target);
      });
    }, { rootMargin: '240px 0px' });
    filmVideos.forEach(video => posterObserver.observe(video));
  } else {
    filmVideos.forEach(loadFilmPoster);
  }
  if (filmTrack) {
    const filmNavigation = $('.film-navigation');
    const filmButtons = $$('[data-film-direction]');
    filmNavigation.hidden = false;
    const syncFilmNavigation = () => {
      const end = filmTrack.scrollWidth - filmTrack.clientWidth;
      filmButtons.forEach(button => {
        button.disabled = Number(button.dataset.filmDirection) < 0
          ? filmTrack.scrollLeft <= 2 : filmTrack.scrollLeft >= end - 2;
      });
    };
    filmButtons.forEach(button => button.addEventListener('click', () => {
      const card = $('.film-card', filmTrack);
      const gap = parseFloat(getComputedStyle(filmTrack).columnGap) || 0;
      filmTrack.scrollBy({ left: Number(button.dataset.filmDirection) * (card.getBoundingClientRect().width + gap), behavior: motionPreference.matches ? 'instant' : 'smooth' });
    }));
    filmTrack.addEventListener('scroll', syncFilmNavigation, { passive: true });
    window.addEventListener('resize', syncFilmNavigation, { passive: true });
    filmVideos.forEach(video => video.addEventListener('play', () => {
      filmVideos.forEach(other => { if (other !== video) other.pause(); });
    }));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) filmVideos.forEach(video => video.pause());
    });
    if ('IntersectionObserver' in window) {
      const playbackObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (!entry.isIntersecting) entry.target.pause(); });
      }, { threshold: 0 });
      filmVideos.forEach(video => playbackObserver.observe(video));
    }
    syncFilmNavigation();
  }

  const galleryItems = $$('.gallery-item');
  const filterButtons = $$('.filters button');
  function applyFilter(category) {
    const validCategories = filterButtons.map(button => button.dataset.filter);
    if (!validCategories.includes(category)) return;
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    galleryItems.forEach(item => { item.hidden = category !== 'all' && item.dataset.category !== category; });
    const count = galleryItems.filter(item => !item.hidden).length;
    $('#gallery-status').textContent = `${count} photographie${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}`;
  }
  filterButtons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
  $$('[data-select-filter]').forEach(link => link.addEventListener('click', () => applyFilter(link.dataset.selectFilter)));

  function showPhoto(index) {
    if (!activeGallery.length) return;
    photoIndex = (index + activeGallery.length) % activeGallery.length;
    const item = activeGallery[photoIndex];
    const original = $('img', item);
    $('#lightbox-image').src = original.dataset.full || original.getAttribute('src');
    $('#lightbox-image').alt = original.alt;
    $('#lightbox-title').textContent = $('figcaption>span', item).textContent;
    $('#lightbox-count').textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(activeGallery.length).padStart(2, '0')}`;
    $('.lightbox-prev').disabled = $('.lightbox-next').disabled = activeGallery.length < 2;
  }
  galleryItems.forEach(item => $('button', item).addEventListener('click', () => {
    previousFocus = document.activeElement;
    activeGallery = galleryItems.filter(photo => !photo.hidden);
    showPhoto(activeGallery.indexOf(item));
    lightbox.showModal();
    syncLock();
    $('.lightbox-close').focus();
  }));
  $('.lightbox-close').addEventListener('click', () => lightbox.close());
  $('.lightbox-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  $('.lightbox-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(photoIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(photoIndex + 1); }
  });
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox || event.target === $('.lightbox-view')) lightbox.close();
  });
  let touchStart = null;
  const lightboxImage = $('#lightbox-image');
  lightboxImage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  lightboxImage.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) showPhoto(photoIndex + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  const infoPages = {
    legal: {
      title: 'Mentions légales',
      content: '<h3>Le portfolio</h3><p>Ce site présente l’univers et les créations de Talyana Rossignol, Hair Stylist basée à Paris.</p><h3>Contact</h3><p><a href="mailto:rossignoltalyana12@gmail.com">rossignoltalyana12@gmail.com</a></p><h3>Photographies & contenus</h3><p>Les photographies ont été fournies pour la présentation du portfolio. Pour toute question relative à un visuel, un crédit ou une demande de retrait, contactez Talyana par e-mail.</p><h3>Informations à compléter</h3><p>Avant une ouverture publique, les coordonnées administratives de l’éditeur, son statut, les mentions d’immatriculation le cas échéant, la direction de publication et les coordonnées légales de l’hébergeur devront être renseignés et vérifiés.</p>'
    },
    privacy: {
      title: 'Confidentialité',
      content: '<h3>Votre demande de contact</h3><p>Votre nom, votre adresse e-mail, votre société ou projet et votre message servent à répondre à votre demande. Lorsque l’envoi direct est disponible, ces informations transitent par Vercel et le prestataire e-mail Resend, puis sont adressées à la messagerie de Talyana. Le formulaire ne crée aucun abonnement à une newsletter.</p><p>En cas d’indisponibilité, vous pouvez utiliser votre messagerie ou copier votre demande. L’envoi reste alors à confirmer dans votre application de messagerie. Des informations techniques peuvent être traitées pour limiter les abus. Les messages et les journaux d’envoi peuvent être conservés par les prestataires selon leurs conditions.</p><h3>Navigation</h3><p>Le code de ce portfolio n’ajoute ni outil publicitaire ni mesure d’audience. Les photographies et les polices sont hébergées avec le site. La plateforme d’hébergement peut traiter les données techniques nécessaires à l’accès et au fonctionnement du site, selon ses propres conditions.</p><h3>Liens externes</h3><p>Le lien Facebook ouvre un service externe disposant de sa propre politique de confidentialité.</p><h3>Nous contacter</h3><p>Pour une question concernant vos échanges par e-mail : <a href="mailto:rossignoltalyana12@gmail.com">rossignoltalyana12@gmail.com</a>.</p>'
    }
  };
  $$('[data-dialog]').forEach(button => button.addEventListener('click', () => {
    const page = infoPages[button.dataset.dialog];
    previousFocus = button;
    $('#info-title').textContent = page.title;
    $('#info-content').innerHTML = page.content;
    infoDialog.showModal();
    syncLock();
    $('.info-close').focus();
  }));
  $('.info-close').addEventListener('click', () => infoDialog.close());
  $('.info-done').addEventListener('click', () => infoDialog.close());
  infoDialog.addEventListener('click', event => { if (event.target === infoDialog) {
    const rect = infoDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) infoDialog.close();
  }});
  [infoDialog, lightbox].forEach(dialog => dialog.addEventListener('close', () => {
    syncLock();
    previousFocus?.focus({ preventScroll: true });
  }));

  const contactEndpoint = 'https://talyana-rossignol-portfolio.vercel.app/api/contact';
  let contactToken = null;
  let tokenRequest = null;
  let sendingContact = false;
  async function prepareContact(force = false) {
    if (force) { contactToken = null; tokenRequest = null; }
    if (contactToken) return contactToken;
    if (!tokenRequest) {
      tokenRequest = fetch(contactEndpoint, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
        .then(async response => {
          const data = await response.json();
          if (!response.ok || !data.available) return null;
          contactToken = data.token;
          return contactToken;
        }).catch(() => null).finally(() => { tokenRequest = null; });
    }
    return tokenRequest;
  }
  $('#contact-form').addEventListener('focusin', () => { prepareContact(); }, { once: true });
  function showManualContact(subject) {
    $('.copy-request').hidden = false;
    const fallback = $('#contact-mailto');
    fallback.href = `mailto:rossignoltalyana12@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(requestText)}`;
    fallback.hidden = false;
  }
  $('#contact-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (sendingContact || !form.reportValidity()) return;
    const data = new FormData(form);
    const fields = Object.fromEntries(['name','company','email','message','website'].map(key => [key, String(data.get(key) || '').trim()]));
    const { name, company, email, message } = fields;
    const subject = `Demande de ${name}${company ? ` — ${company}` : ''}`;
    requestText = `Bonjour Talyana,\n\n${message}\n\nNom : ${name}\nSociété / Projet : ${company || 'Non précisé'}\nE-mail : ${email}`;
    const status = $('#form-status');
    const button = $('.submit-button');
    const label = button.innerHTML;
    sendingContact = true;
    button.disabled = true;
    button.textContent = 'Envoi en cours…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = '';
    $('#contact-mailto').hidden = true;
    $('.copy-request').hidden = true;
    try {
      const token = await prepareContact();
      if (!token) throw new Error('L’envoi direct est momentanément indisponible. Votre texte est conservé : utilisez le lien « Envoyer par ma messagerie » ci-dessous.');
      const response = await fetch(contactEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, token }), signal: AbortSignal.timeout(18000)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        if (result.code === 'expired') await prepareContact(true);
        throw new Error(result.error || 'L’envoi n’a pas pu être confirmé. Réessayez ou utilisez votre messagerie.');
      }
      status.textContent = 'Votre demande a bien été envoyée à Talyana. Merci !';
      form.reset();
      $('#copy-fallback')?.remove();
      requestText = '';
      contactToken = null;
      tokenRequest = null;
      status.focus();
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' || error.name === 'TypeError'
        ? 'L’envoi n’a pas pu être confirmé. Votre texte est conservé : réessayez ou utilisez votre messagerie.'
        : error.message;
      showManualContact(subject);
    } finally {
      sendingContact = false;
      button.disabled = false;
      button.innerHTML = label;
      form.removeAttribute('aria-busy');
    }
  });
  $('.copy-request').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(requestText);
      $('#form-status').textContent = 'Demande copiée. Collez-la dans un e-mail à rossignoltalyana12@gmail.com.';
    } catch {
      let fallback = $('#copy-fallback');
      if (!fallback) {
        fallback = document.createElement('textarea');
        fallback.id = 'copy-fallback';
        fallback.setAttribute('aria-label', 'Demande à copier manuellement');
        fallback.rows = 7;
        fallback.readOnly = true;
        $('#contact-form').appendChild(fallback);
      }
      fallback.value = requestText;
      fallback.focus();
      fallback.select();
      $('#form-status').textContent = 'Sélectionnez et copiez le texte ci-dessous, puis collez-le dans votre messagerie.';
    }
  });

  setMotion();
  document.fonts?.ready.then(measure);
})();
