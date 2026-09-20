/**
 * THE JOKER PHOTOGRAPHY STUDIO — INTERACTIVE SCRIPT
 * Features: Gold Particles Canvas, Counters, Filterable Gallery, Lightbox,
 * Testimonials Slider, WhatsApp Booking Integration & Mobile Menu.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Set current copyright year
  const currentYearEl = document.getElementById('currentYear');
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------------------------
     1. PARTICLES CANVAS ANIMATION (GOLD AMBIENT DUST)
     -------------------------------------------------------------------------- */
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 20), 65);

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.2 + 0.6;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = -Math.random() * 0.5 - 0.2; // float upwards
        this.alpha = Math.random() * 0.7 + 0.2;
        this.color = Math.random() > 0.3 ? '229, 169, 60' : '251, 224, 137'; // gold tones
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y < 0) {
          this.y = height + 10;
          this.x = Math.random() * width;
        }
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${this.color}, 0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  }

  /* --------------------------------------------------------------------------
     1.5 TYPEWRITER ANIMATION (HERO SLOGAN)
     -------------------------------------------------------------------------- */
  const typewriterEl = document.getElementById('typewriterText');
  if (typewriterEl) {
    const phrases = [
      'لحظاتك .. بطريقتنا',
      'كل لحظة تستاهل تتصور بشكل مختلف'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeLoop() {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        charIndex--;
        typewriterEl.textContent = currentPhrase.substring(0, charIndex);
      } else {
        charIndex++;
        typewriterEl.textContent = currentPhrase.substring(0, charIndex);
      }

      let speed = isDeleting ? 40 : 90;

      // Natural pause on dots/punctuation for realistic feel
      if (!isDeleting && currentPhrase[charIndex - 1] === '.') {
        speed = 220;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        // Complete phrase typed: pause and enjoy
        speed = 3500;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        // Deletion complete: switch to next slogan
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        speed = 450;
      }

      setTimeout(typeLoop, speed);
    }

    // Start typing after a short smooth entrance delay
    setTimeout(() => {
      typewriterEl.textContent = '';
      typeLoop();
    }, 450);
  }

  /* --------------------------------------------------------------------------
     2. HEADER SCROLL & MOBILE NAVIGATION
     -------------------------------------------------------------------------- */
  const header = document.getElementById('header');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // Merged scroll handler: sticky header + active nav link (single listener)
  window.addEventListener('scroll', () => {
    // Sticky header
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }

    // Active nav link highlight
    const scrollY = window.pageYOffset + 200;
    sections.forEach((current) => {
      const sectionId = current.getAttribute('id');
      const activeLink = document.querySelector(`.nav-menu a[href*="${sectionId}"]`);
      if (scrollY > current.offsetTop && scrollY <= current.offsetTop + current.offsetHeight) {
        navLinks.forEach((link) => link.classList.remove('active'));
        if (activeLink) activeLink.classList.add('active');
      }
    });
  });

  // Mobile menu toggle
  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('open');
      const isOpen = navMenu.classList.toggle('open');
      document.body.classList.toggle('menu-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close when clicking nav link
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('open');
        navMenu.classList.remove('open');
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !hamburgerBtn.contains(e.target)
      ) {
        hamburgerBtn.classList.remove('open');
        navMenu.classList.remove('open');
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
      }
    });
  }

  /* --------------------------------------------------------------------------
     3. STATS COUNTER ANIMATION
     -------------------------------------------------------------------------- */
  const statNumbers = document.querySelectorAll('.stat-number');
  let hasCounted = false;

  const countUp = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 2000;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        el.textContent = target.toLocaleString('ar-EG');
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current).toLocaleString('ar-EG');
      }
    }, stepTime);
  };

  const statsSection = document.querySelector('.stats-bar');
  if (statsSection) {
    const statsObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasCounted) {
            hasCounted = true;
            statNumbers.forEach((num) => countUp(num));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    statsObserver.observe(statsSection);
  }

  /* --------------------------------------------------------------------------
     4. DYNAMIC GALLERY LOADER & PORTFOLIO FILTER TABS
     -------------------------------------------------------------------------- */
  const galleryGrid = document.getElementById('galleryGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const CATEGORY_LABELS = {
    wedding: 'أفراح ومناسبات',
    portrait: 'جلسات وبورتريه',
    video: 'فيديو وتغطيات',
    retouch: 'تعديل وتفاصيل'
  };

  // Helper to render dynamic items into the gallery
  const renderDynamicGallery = (items) => {
    if (!galleryGrid || !items || items.length === 0) return;

    galleryGrid.innerHTML = items.map((item) => {
      const tagText = CATEGORY_LABELS[item.category] || item.category;
      return `
        <div class="gallery-item" data-category="${item.category}" tabindex="0">
          <div class="gallery-img-box">
            <img src="${item.src}" alt="${item.caption || 'عمل من استوديو الجوكر'}" loading="lazy">
            <div class="gallery-overlay">
              <span class="gallery-tag">${tagText}</span>
              <h4 class="gallery-caption">${item.caption || ''}</h4>
              <p class="gallery-subcaption">${item.subcaption || ''}</p>
              <div class="gallery-zoom-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    bindGalleryInteractions();
  };

  // Attempt to load dynamic gallery from Cloudinary or synchronized localStorage
  const loadDynamicGallery = async () => {
    let loadedFromStorage = false;
    try {
      const saved = localStorage.getItem('joker_gallery_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          renderDynamicGallery(parsed);
          loadedFromStorage = true;
        }
      }
    } catch (e) {
      console.warn('Could not read saved gallery items from localStorage:', e);
    }

    // Try fetching fresh Cloudinary list if not offline
    try {
      const configStr = localStorage.getItem('joker_cloudinary_config');
      const config = configStr ? JSON.parse(configStr) : { cloudName: 'qrif7qmf', galleryTag: 'joker-gallery' };
      const res = await fetch(`https://res.cloudinary.com/${config.cloudName}/image/list/${config.galleryTag}.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.resources) && data.resources.length > 0) {
          const deletedIds = JSON.parse(localStorage.getItem('joker_gallery_deleted') || '[]');
          const cloudItems = data.resources
            .filter(r => !deletedIds.includes(r.public_id))
            .map(r => {
              const custom = (r.context && r.context.custom) || {};
              let cat = custom.category || 'wedding';
              if (r.tags && Array.isArray(r.tags)) {
                const found = ['wedding', 'portrait', 'video', 'retouch'].find(c => r.tags.includes(c));
                if (found) cat = found;
              }
              return {
                id: r.public_id,
                src: `https://res.cloudinary.com/${config.cloudName}/image/upload/q_auto,f_auto,w_1200/v${r.version}/${r.public_id}.${r.format}`,
                category: cat,
                caption: custom.caption || `عمل استوديو الجوكر #${r.public_id.slice(-4)}`,
                subcaption: custom.subcaption || 'تصوير وإخراج احترافي — استوديو الجوكر',
                source: 'cloudinary'
              };
            });

          if (cloudItems.length > 0) {
            renderDynamicGallery(cloudItems);
          }
        }
      }
    } catch (err) {
      // If network fails or resource list is restricted, we already gracefully rendered localStorage or fallback static HTML
    }
  };

  // Filter click handler
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');
      const items = document.querySelectorAll('.gallery-item');

      items.forEach((item) => {
        const itemCategory = item.getAttribute('data-category');
        if (filterValue === 'all' || itemCategory === filterValue) {
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 50);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.9)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
     5. LIGHTBOX MODAL
     -------------------------------------------------------------------------- */
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCategory = document.getElementById('lightboxCategory');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let currentGalleryIndex = 0;
  const visibleGalleryItems = () =>
    Array.from(document.querySelectorAll('.gallery-item')).filter(
      (item) => item.style.display !== 'none'
    );

  const openLightbox = (index) => {
    const items = visibleGalleryItems();
    if (index < 0 || index >= items.length) return;
    currentGalleryIndex = index;
    const currentItem = items[index];

    const img = currentItem.querySelector('img');
    const caption = currentItem.querySelector('.gallery-caption');
    const tag = currentItem.querySelector('.gallery-tag');

    if (lightbox) lightbox.classList.remove('is-single-preview');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxTitle.textContent = caption ? caption.textContent : '';
    lightboxCategory.textContent = tag ? tag.textContent : '';

    lightbox.classList.add('active');
    document.body.classList.add('lightbox-open');
    document.body.style.overflow = 'hidden';
  };

  const openSingleImageLightbox = (src, alt, title, category) => {
    if (!lightbox) return;
    lightbox.classList.add('is-single-preview');
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxTitle.textContent = title || '';
    lightboxCategory.textContent = category || '';

    lightbox.classList.add('active');
    document.body.classList.add('lightbox-open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightbox.classList.remove('is-single-preview');
    document.body.classList.remove('lightbox-open');
    document.body.style.overflow = '';
  };

  const showNextImage = () => {
    const items = visibleGalleryItems();
    if (items.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex + 1) % items.length;
    openLightbox(currentGalleryIndex);
  };

  const showPrevImage = () => {
    const items = visibleGalleryItems();
    if (items.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex - 1 + items.length) % items.length;
    openLightbox(currentGalleryIndex);
  };

  const bindGalleryInteractions = () => {
    const items = document.querySelectorAll('.gallery-item');
    items.forEach((item) => {
      item.onclick = () => {
        const activeItems = visibleGalleryItems();
        const index = activeItems.indexOf(item);
        openLightbox(index);
      };

      item.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const activeItems = visibleGalleryItems();
          const index = activeItems.indexOf(item);
          openLightbox(index);
        }
      };
    });
  };

  // Initial binding for static items
  bindGalleryInteractions();

  // Trigger dynamic loader
  loadDynamicGallery();

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', showNextImage);
  if (lightboxPrev) lightboxPrev.addEventListener('click', showPrevImage);

  // Close on outside click
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Keyboard navigation for Lightbox — guard against missing element
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (!lightbox.classList.contains('is-single-preview')) {
      if (e.key === 'ArrowRight') showPrevImage(); // RTL: right arrow = previous
      if (e.key === 'ArrowLeft') showNextImage();
    }
  });

  // Logo zoom trigger handlers (Header & Footer)
  const logoTriggers = document.querySelectorAll('.logo-zoom-trigger, .brand-logo');
  logoTriggers.forEach((trigger) => {
    const handleLogoClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.openJokerLogo === 'function') {
        window.openJokerLogo(e);
      } else {
        openSingleImageLightbox(
          'assets/joker-logo.jpg',
          'شعار الجوكر للتصوير',
          'شعار الجوكر للتصوير',
          'الهوية البصرية الرسمية — استوديو الجوكر للتصوير'
        );
      }
    };

    trigger.addEventListener('click', handleLogoClick);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleLogoClick(e);
      }
    });
  });

  // Hero visual card zoom
  const visualCard = document.querySelector('.visual-card');
  if (visualCard) {
    visualCard.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.openHeroBrand === 'function') {
        window.openHeroBrand(e);
      } else {
        openSingleImageLightbox(
          'assets/hero-brand.jpeg',
          'لوحة وهوية الجوكر للتصوير',
          'لوحة وهوية الجوكر للتصوير',
          'استوديو الجوكر للتصوير — دمياط'
        );
      }
    });
  }

  /* --------------------------------------------------------------------------
     6. TESTIMONIALS SLIDER
     -------------------------------------------------------------------------- */
  const testimonials = document.querySelectorAll('.testimonial-card');
  const sliderDotsContainer = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');
  let currentTestimonial = 0;
  let testimonialInterval = null;

  if (testimonials.length > 0) {
    if (sliderDotsContainer) {
      sliderDotsContainer.innerHTML = '';
      testimonials.forEach((_, idx) => {
        const dot = document.createElement('span');
        dot.classList.add('slider-dot');
        if (idx === 0) dot.classList.add('active');
        dot.setAttribute('role', 'button');
        dot.setAttribute('aria-label', `عرض الرأي رقم ${idx + 1}`);
        dot.addEventListener('click', () => goToTestimonial(idx));
        sliderDotsContainer.appendChild(dot);
      });
    }

    const dots = document.querySelectorAll('.slider-dot');

    const updateSlider = () => {
      testimonials.forEach((card, idx) => {
        if (idx === currentTestimonial) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentTestimonial);
      });
    };

    const goToTestimonial = (idx) => {
      currentTestimonial = idx;
      updateSlider();
    };

    const nextTestimonial = () => {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      updateSlider();
    };

    const prevTestimonial = () => {
      currentTestimonial =
        (currentTestimonial - 1 + testimonials.length) % testimonials.length;
      updateSlider();
    };

    if (nextBtn) nextBtn.addEventListener('click', nextTestimonial);
    if (prevBtn) prevBtn.addEventListener('click', prevTestimonial);

    // Initial activation
    updateSlider();

    // Auto-advance every 5 seconds
    const startAutoSlide = () => {
      stopAutoSlide();
      testimonialInterval = setInterval(nextTestimonial, 5000);
    };

    const stopAutoSlide = () => {
      if (testimonialInterval) clearInterval(testimonialInterval);
    };

    const sliderContainer = document.querySelector('.testimonials-slider-container');
    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', stopAutoSlide);
      sliderContainer.addEventListener('mouseleave', startAutoSlide);

      // Touch swipe support for mobile
      let touchStartX = 0;
      let touchEndX = 0;

      sliderContainer.addEventListener(
        'touchstart',
        (e) => {
          stopAutoSlide();
          touchStartX = e.changedTouches[0].screenX;
        },
        { passive: true }
      );

      sliderContainer.addEventListener(
        'touchend',
        (e) => {
          touchEndX = e.changedTouches[0].screenX;
          const diff = touchStartX - touchEndX;
          // In RTL: swiping right-to-left (diff > 40) means next, left-to-right means prev
          if (Math.abs(diff) > 40) {
            if (diff > 0) {
              nextTestimonial();
            } else {
              prevTestimonial();
            }
          }
          startAutoSlide();
        },
        { passive: true }
      );
    }

    startAutoSlide();
  }

  /* --------------------------------------------------------------------------
     7. BOOKING & INQUIRY FORM (WHATSAPP INTEGRATION)
     -------------------------------------------------------------------------- */
  const bookingForm = document.getElementById('bookingForm');
  const formFeedback = document.getElementById('formFeedback');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('clientName').value.trim();
      const phone = document.getElementById('clientPhone').value.trim();
      const service = document.getElementById('serviceType').value;
      const date = document.getElementById('eventDate').value;
      const notes = document.getElementById('clientNotes').value.trim();

      if (!name || !phone || !service) {
        // Show inline error without mutating the success-state HTML
        const existingError = bookingForm.querySelector('.form-inline-error');
        const errEl = existingError || document.createElement('p');
        if (!existingError) {
          errEl.className = 'form-inline-error';
          bookingForm.appendChild(errEl);
        }
        errEl.textContent = '⚠️ يرجى ملء جميع الحقول الإلزامية (الاسم، الهاتف، الخدمة)';
        errEl.style.display = 'block';
        setTimeout(() => { errEl.style.display = 'none'; }, 4000);
        return;
      }

      // Build personalized Arabic WhatsApp message
      let message = `*طلب حجز واستفسار جديد — الجوكر للتصوير*\n`;
      message += `------------------------------------\n`;
      message += `👤 *الاسم:* ${name}\n`;
      message += `📱 *رقم الهاتف:* ${phone}\n`;
      message += `📸 *الخدمة المطلوبة:* ${service}\n`;
      if (date) {
        message += `📅 *تاريخ المناسبة:* ${date}\n`;
      }
      if (notes) {
        message += `📝 *ملاحظات وتفاصيل:* ${notes}\n`;
      }
      message += `------------------------------------\n`;
      message += `أرجو التكرم بالرد بخصوص التوافر والتفاصيل. شكراً جزيلاً!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/201105599470?text=${encodedMessage}`;

      // Show success feedback — the formFeedback div contains the success HTML defined in index.html
      bookingForm.style.display = 'none';
      if (formFeedback) {
        formFeedback.style.display = 'block';
      }

      // Redirect to WhatsApp
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);
    });
  }

  /* --------------------------------------------------------------------------
     8. SCROLL REVEAL ANIMATIONS
     -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll(
    '.about-card, .service-card, .gallery-item, .contact-card, .social-channels-card, .booking-form-wrapper'
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(25px)';
    el.style.transition =
      'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    revealObserver.observe(el);
  });
});
