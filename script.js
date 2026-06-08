(() => {
  'use strict';

  const PHONE = '5491130801404';
  const IMG_BASE = 'imag/';

  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function waLink(message) {
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  }

  // WhatsApp buttons
  function bindWaButtons() {
    document.querySelectorAll('[data-wa]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        window.open(waLink(el.dataset.wa), '_blank', 'noopener,noreferrer');
      });
    });
  }

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header shadow
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', window.scrollY > 20);
  }, { passive: true });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Carousel logic
  function createCarousel(images, productId) {
    const wrap = document.createElement('div');
    wrap.className = 'carousel';

    if (!images || images.length === 0) {
      wrap.classList.add('carousel--empty');
      wrap.innerHTML = '<span>Foto próximamente</span>';
      return wrap;
    }

    const track = document.createElement('div');
    track.className = 'carousel__track';
    let current = 0;

    images.forEach(src => {
      const slide = document.createElement('div');
      slide.className = 'carousel__slide';
      const img = document.createElement('img');
      img.src = IMG_BASE + src;
      img.alt = productId;
      img.loading = 'lazy';
      img.addEventListener('click', () => openLightbox(images.map(s => IMG_BASE + s), images.indexOf(src)));
      slide.appendChild(img);
      track.appendChild(slide);
    });

    wrap.appendChild(track);

    if (images.length > 1) {
      const prev = document.createElement('button');
      prev.className = 'carousel__btn carousel__btn--prev';
      prev.innerHTML = '&#8249;';
      prev.setAttribute('aria-label', 'Anterior');
      const next = document.createElement('button');
      next.className = 'carousel__btn carousel__btn--next';
      next.innerHTML = '&#8250;';
      next.setAttribute('aria-label', 'Siguiente');

      const dots = document.createElement('div');
      dots.className = 'carousel__dots';
      images.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel__dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Imagen ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dots.appendChild(dot);
      });

      function goTo(i) {
        current = i;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.querySelectorAll('.carousel__dot').forEach((d, idx) => {
          d.classList.toggle('active', idx === current);
        });
      }

      prev.addEventListener('click', () => goTo(current <= 0 ? images.length - 1 : current - 1));
      next.addEventListener('click', () => goTo(current >= images.length - 1 ? 0 : current + 1));

      wrap.appendChild(prev);
      wrap.appendChild(next);
      wrap.appendChild(dots);
    }

    return wrap;
  }

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCounter = document.getElementById('lightbox-counter');
  let lbImages = [];
  let lbIndex = 0;

  function openLightbox(imgs, idx) {
    lbImages = imgs;
    lbIndex = idx;
    showLbImage();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function showLbImage() {
    lbImg.src = lbImages[lbIndex];
    lbCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
  }

  document.getElementById('lightbox-close').addEventListener('click', () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  });
  document.getElementById('lightbox-prev').addEventListener('click', () => {
    lbIndex = lbIndex <= 0 ? lbImages.length - 1 : lbIndex - 1;
    showLbImage();
  });
  document.getElementById('lightbox-next').addEventListener('click', () => {
    lbIndex = lbIndex >= lbImages.length - 1 ? 0 : lbIndex + 1;
    showLbImage();
  });
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
    if (e.key === 'ArrowLeft') { lbIndex = lbIndex <= 0 ? lbImages.length - 1 : lbIndex - 1; showLbImage(); }
    if (e.key === 'ArrowRight') { lbIndex = lbIndex >= lbImages.length - 1 ? 0 : lbIndex + 1; showLbImage(); }
  });

  // Build menu from JSON
  async function loadData() {
    try {
      const res = await fetch('imagenes.json');
      if (!res.ok) throw new Error('No se pudo cargar imagenes.json');
      const data = await res.json();
      renderMenu(data.categorias);
      renderGallery(data.galeria.imagenes);
      bindWaButtons();
      initAnimations();
    } catch (err) {
      console.error(err);
      document.getElementById('menu-container').innerHTML =
        '<p style="text-align:center;color:#5C4A78;padding:40px;">Error cargando el menú. Recargá la página.</p>';
    }
  }

  function renderMenu(categorias) {
    const container = document.getElementById('menu-container');
    categorias.forEach(cat => {
      const section = document.createElement('div');
      section.className = 'menu__category';
      section.innerHTML = `
        <div class="menu__category-header">
          <span class="menu__category-icon">${sanitize(cat.icono)}</span>
          <div>
            <h3 class="menu__category-title">${sanitize(cat.nombre)}</h3>
            <p class="menu__category-desc">${sanitize(cat.descripcion)}</p>
          </div>
        </div>`;

      const grid = document.createElement('div');
      grid.className = 'menu__grid';

      cat.productos.forEach(prod => {
        const card = document.createElement('article');
        card.className = 'menu__card';

        const carousel = createCarousel(prod.imagenes, prod.nombre);
        card.appendChild(carousel);

        const body = document.createElement('div');
        body.className = 'menu__card-body';

        const waMsg = prod.mensaje_wa || `Hola! Quiero pedir ${prod.nombre}`;

        body.innerHTML = `
          <h4 class="menu__card-title">${sanitize(prod.nombre)}</h4>
          <p class="menu__card-desc">${sanitize(prod.descripcion)}</p>
          ${prod.imagenes && prod.imagenes.length > 0 ?
            `<a href="#" class="btn btn--sm btn--whatsapp" data-wa="${sanitize(waMsg)}">
              <svg class="btn__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.347.223-.52.025-.172.025-.347-.075-.52-.099-.172-.557-1.315-.76-1.786-.2-.467-.406-.403-.544-.403h-.468c-.173 0-.446.074-.68.372-.235.297-.896.876-.896 2.137 0 1.26.92 2.48 1.048 2.653.13.173 1.81 2.764 4.39 3.876.614.265 1.093.423 1.466.54.616.196 1.176.168 1.62.102.494-.074 1.527-.624 1.742-1.228.216-.604.216-1.122.15-1.228-.074-.1-.272-.149-.57-.298zM12.004 2C6.489 2 2.003 6.484 2.003 12c0 1.762.46 3.478 1.333 4.993L2 22l5.123-1.324A9.96 9.96 0 0012.004 22C17.52 22 22 17.516 22 12S17.52 2 12.004 2z"/></svg>
              Pedir</a>` :
            `<span class="menu__card-soon">Próximamente</span>`}`;

        card.appendChild(body);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });
  }

  function renderGallery(images) {
    const container = document.getElementById('gallery-container');
    const fullPaths = images.map(src => IMG_BASE + src);
    images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = IMG_BASE + src;
      img.alt = 'Producto casero';
      img.className = 'gallery__img';
      img.loading = 'lazy';
      img.addEventListener('click', () => openLightbox(fullPaths, i));
      container.appendChild(img);
    });
  }

  // Scroll animations
  function initAnimations() {
    const els = [
      ...document.querySelectorAll('.menu__card, .gallery__img, .contact__card'),
    ];
    els.forEach(el => el.classList.add('fade-in'));

    const aboutImg = document.querySelector('.about__img-wrap');
    const aboutText = document.querySelector('.about__text');
    if (aboutImg) aboutImg.classList.add('fade-in-left');
    if (aboutText) aboutText.classList.add('fade-in-right');

    const all = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      all.forEach(el => obs.observe(el));
    } else {
      all.forEach(el => el.classList.add('visible'));
    }
  }

  bindWaButtons();
  loadData();
})();
