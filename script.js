"use strict";

document.addEventListener("DOMContentLoaded", () => {
  let WHATSAPP_NUMBER = "5528999835920";

  /* =========================================================
     HELPERS
  ========================================================= */

  function scrollToElement(id) {
    const element = document.getElementById(id);

    if (!element) {
      console.warn(`Elemento não encontrado: #${id}`);
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function openWhatsApp(message) {
    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }


  /* =========================================================
     INTEGRAÇÃO REAL COM O PAINEL / API PÚBLICA
  ========================================================= */
  function normalizeWhatsApp(value) {
    return String(value || "").replace(/\D/g, "") || "5528999835920";
  }

  function renderCatalog(products) {
    const grid = document.getElementById("catalogGrid");
    if (!grid || !Array.isArray(products) || !products.length) return;
    grid.innerHTML = products.map((p) => `
      <article class="catalog-card">
        <img src="${escapeHtml(p.image || "assets/catalogo-vestido-1.jpg")}" alt="${escapeHtml(p.name || "Vestido do Ateliê")}" loading="lazy">
        <div class="catalog-card-content">
          <p class="card-kicker">${escapeHtml(p.category || "COLEÇÃO")}</p>
          <h3>${escapeHtml(p.name || "Criação Natália Huebra")}</h3>
          <p>${escapeHtml(p.description || "Criação sob medida para o seu momento.")}</p>
          <div class="catalog-price">${escapeHtml(p.price || "Consulte disponibilidade e valores")}</div>
          <button class="catalog-buy-btn" type="button" data-nome="${escapeHtml(p.name || "vestido do catálogo")}">Tenho interesse</button>
        </div>
      </article>`).join("");
  }

  function renderGallery(items) {
    const grid = document.getElementById("galleryGrid");
    if (!grid || !Array.isArray(items) || !items.length) return;
    grid.innerHTML = items.map((g) => `
      <button class="gallery-item" type="button" data-category="${escapeHtml(g.category || "atelie")}" data-full="${escapeHtml(g.url || "")}" data-caption="${escapeHtml(g.caption || g.title || "Galeria")}">
        <img src="${escapeHtml(g.url || "")}" alt="${escapeHtml(g.caption || g.title || "Imagem do Ateliê")}" loading="lazy">
      </button>`).join("");
  }

  function renderVideos(items) {
    const grid = document.getElementById("videoGrid");
    if (!grid || !Array.isArray(items) || !items.length) return;
    grid.innerHTML = items.map((v) => {
      const isYoutube = v.type === "youtube" || /youtube\.com|youtu\.be/i.test(v.url || "");
      const videoMarkup = isYoutube
        ? `<div class="video-thumb-placeholder">▶</div>`
        : `<video src="${escapeHtml(v.url || "")}" muted playsinline preload="metadata" aria-hidden="true"></video>`;
      return `<button class="video-item" type="button" data-video="${isYoutube ? "" : escapeHtml(v.url || "")}" data-youtube="${isYoutube ? escapeHtml((v.url || "").match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] || "") : ""}" data-caption="${escapeHtml(v.caption || v.title || "Vídeo do Ateliê")}">${videoMarkup}<span class="play-icon" aria-hidden="true">▶</span><span class="video-label">${escapeHtml(v.title || "Vídeo")}</span></button>`;
    }).join("");
  }

  function applyPublicSettings(settings) {
    if (!settings) return;
    WHATSAPP_NUMBER = normalizeWhatsApp(settings.phone);
    const phone = document.getElementById("publicPhone");
    const email = document.getElementById("publicEmail");
    const address = document.getElementById("publicAddress");
    if (phone) phone.textContent = settings.phone || "";
    if (email) email.textContent = settings.email || "";
    if (address) address.textContent = settings.address || "";
    const emailLink = document.getElementById("footerEmail");
    const waLink = document.getElementById("footerWhatsApp");
    const insta = document.getElementById("footerInstagram");
    const fb = document.getElementById("footerFacebook");
    const yt = document.getElementById("footerYouTube");
    const wa = `https://wa.me/${WHATSAPP_NUMBER}`;
    if (emailLink) { emailLink.href = `mailto:${settings.email || ""}`; }
    if (waLink) waLink.href = wa;
    if (insta && settings.instagram) insta.href = settings.instagram;
    if (fb && settings.facebook) fb.href = settings.facebook;
    if (yt && settings.youtube) yt.href = settings.youtube;
    const float = document.getElementById("whatsappFloat");
    if (float) float.href = wa;
    const ytf = document.querySelector(".video-responsive iframe");
    if (ytf && settings.youtube) ytf.src = settings.youtube;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  }

  async function hydratePublicSite() {
    try {
      const response = await fetch("/api/public", { cache: "no-store" });
      if (!response.ok) throw new Error("API pública indisponível");
      const data = await response.json();
      applyPublicSettings(data.settings);
      renderCatalog(data.products);
      renderGallery(data.gallery);
      renderVideos(data.videos);
      galleryItems = [...document.querySelectorAll(".gallery-item")];
      bindPublicInteractions();
    } catch (error) {
      console.warn("Modo de contingência: conteúdo estático preservado.", error);
    }
  }

  function bindPublicInteractions() {
    document.querySelectorAll(".catalog-buy-btn").forEach((button) => {
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => {
        const name = button.dataset.nome || "vestido do catálogo";
        openWhatsApp(`Olá! Tenho interesse no vestido "${name}" do catálogo do Ateliê Natália Huebra. Podem me enviar disponibilidade, valores e mais informações?`);
      });
    });
    document.querySelectorAll(".gallery-item").forEach((item) => {
      if (item.dataset.bound === "1") return;
      item.dataset.bound = "1";
      item.addEventListener("click", () => openLightbox(item));
      item.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLightbox(item); } });
    });
    document.querySelectorAll(".video-item").forEach((item) => {
      if (item.dataset.bound === "1") return;
      item.dataset.bound = "1";
      item.addEventListener("click", () => openVideoModal(item));
      item.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openVideoModal(item); } });
    });
  }

  /* =========================================================
     MENU MOBILE
  ========================================================= */

  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainNav");

  if (menuBtn && nav) {
    function closeMobileMenu() {
      nav.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Abrir menu");
    }

    function toggleMobileMenu() {
      const isOpen = nav.classList.toggle("is-open");

      menuBtn.setAttribute("aria-expanded", String(isOpen));
      menuBtn.setAttribute(
        "aria-label",
        isOpen ? "Fechar menu" : "Abrir menu"
      );
    }

    menuBtn.addEventListener("click", toggleMobileMenu);

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", (event) => {
      if (
        nav.classList.contains("is-open") &&
        !nav.contains(event.target) &&
        !menuBtn.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) {
        closeMobileMenu();
      }
    });
  }

  /* =========================================================
     HEADER SCROLL
  ========================================================= */

  const siteHeader = document.querySelector(".site-header");

  function updateHeader() {
    if (!siteHeader) return;

    siteHeader.classList.toggle(
      "scrolled",
      window.scrollY > 50
    );
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* =========================================================
     BOTÕES DE SCROLL
  ========================================================= */

  document.querySelectorAll("[data-scroll-to]").forEach((button) => {
    button.addEventListener("click", () => {
      scrollToElement(button.dataset.scrollTo);
    });
  });

  const headerBookingBtn =
    document.getElementById("headerBookingBtn");

  if (headerBookingBtn) {
    headerBookingBtn.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToElement("visita");
    });
  }

  /* =========================================================
     FAQ
  ========================================================= */

  const faqButtons = document.querySelectorAll(".faq-q");

  faqButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");

      if (!item) return;

      const isOpen = item.classList.contains("open");

      document.querySelectorAll(".faq-item").forEach((otherItem) => {
        otherItem.classList.remove("open");

        const otherButton = otherItem.querySelector(".faq-q");

        if (otherButton) {
          otherButton.setAttribute("aria-expanded", "false");

          const icon = otherButton.querySelector("span:last-child");

          if (icon) {
            icon.textContent = "＋";
          }
        }
      });

      if (!isOpen) {
        item.classList.add("open");
        button.setAttribute("aria-expanded", "true");

        const icon = button.querySelector("span:last-child");

        if (icon) {
          icon.textContent = "−";
        }
      }
    });
  });

  /* =========================================================
     GALERIA + LIGHTBOX
  ========================================================= */

  let galleryItems = [
    ...document.querySelectorAll(".gallery-item")
  ];

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  let activeItems = galleryItems;
  let currentImage = 0;

  function showImage(index) {
    if (
      !lightbox ||
      !lightboxImage ||
      activeItems.length === 0
    ) {
      return;
    }

    currentImage =
      (index + activeItems.length) % activeItems.length;

    const item = activeItems[currentImage];

    if (!item) return;

    const imageSrc = item.dataset.full;

    if (!imageSrc) {
      console.warn("Imagem ampliada sem data-full.");
      return;
    }

    lightboxImage.src = imageSrc;
    lightboxImage.alt =
      item.dataset.caption || "Imagem ampliada";

    if (lightboxCaption) {
      lightboxCaption.textContent =
        item.dataset.caption || "";
    }
  }

  function openLightbox(item) {
    if (!lightbox) return;

    activeItems = galleryItems.filter(
      (galleryItem) =>
        !galleryItem.classList.contains("is-hidden")
    );

    const index = activeItems.indexOf(item);

    if (index === -1) return;

    showImage(index);

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    lightboxClose?.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;

    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (lightboxImage) {
      lightboxImage.removeAttribute("src");
    }
  }

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => openLightbox(item));

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(item);
      }
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);

  lightboxPrev?.addEventListener("click", () => {
    showImage(currentImage - 1);
  });

  lightboxNext?.addEventListener("click", () => {
    showImage(currentImage + 1);
  });

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  /* =========================================================
     FILTROS DA GALERIA
  ========================================================= */

  const filterTabs = document.querySelectorAll(".filter-tab");

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((button) => {
        button.classList.remove("active");
      });

      tab.classList.add("active");

      const filter = tab.dataset.filter || "all";

      galleryItems.forEach((item) => {
        const shouldShow =
          filter === "all" ||
          item.dataset.category === filter;

        item.classList.toggle(
          "is-hidden",
          !shouldShow
        );
      });
    });
  });

  /* =========================================================
     CATÁLOGO → WHATSAPP
  ========================================================= */

  document.querySelectorAll(".catalog-buy-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const name =
        button.dataset.nome || "vestido do catálogo";

      const message =
        `Olá! Tenho interesse no vestido "${name}" ` +
        `do catálogo do Ateliê Natália Huebra. ` +
        `Podem me enviar disponibilidade, valores e mais informações?`;

      openWhatsApp(message);
    });
  });

  /* =========================================================
     MODAL DE VÍDEO
  ========================================================= */

  const videoModal = document.getElementById("videoModal");
  const videoModalFrame =
    document.getElementById("videoModalFrame");
  const videoModalClose =
    document.getElementById("videoModalClose");

  function closeVideoModal() {
    if (!videoModal) return;

    videoModal.classList.remove("open");
    videoModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (videoModalFrame) {
      videoModalFrame.replaceChildren();
    }
  }

  function isValidYouTubeId(id) {
    return typeof id === "string" && /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  function openVideoModal(item) {
    if (!videoModal || !videoModalFrame) return;

    const videoId = item.dataset.youtube?.trim() || "";
    const videoSrc = item.dataset.video?.trim() || "";
    const caption = item.dataset.caption || "Vídeo do Ateliê Natália Huebra";

    videoModalFrame.replaceChildren();

    if (videoSrc) {
      const video = document.createElement("video");
      video.src = videoSrc;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", caption);
      videoModalFrame.appendChild(video);
    } else if (isValidYouTubeId(videoId)) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.title = caption;
      iframe.loading = "lazy";
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "");
      videoModalFrame.appendChild(iframe);
    } else {
      alert("Este vídeo ainda não foi configurado.");
      return;
    }

    videoModal.classList.add("open");
    videoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    videoModalClose?.focus();
  }

  document.querySelectorAll(".video-item").forEach((item) => {
    item.addEventListener("click", () => openVideoModal(item));

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openVideoModal(item);
      }
    });
  });

  videoModalClose?.addEventListener("click", closeVideoModal);

  videoModal?.addEventListener("click", (event) => {
    if (event.target === videoModal) {
      closeVideoModal();
    }
  });

  /* =========================================================
     FORMULÁRIO → WHATSAPP
  ========================================================= */

  const bookingForm =
    document.getElementById("bookingForm");

  if (bookingForm) {
    bookingForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name =
        document.getElementById("clientName")?.value.trim() || "";

      const email =
        document.getElementById("clientEmail")?.value.trim() || "";

      const phone =
        document.getElementById("clientPhone")?.value.trim() || "";

      const interest =
        document.getElementById("clientInterest")?.value || "";

      const message =
        document.getElementById("clientMessage")?.value.trim() || "";

      if (!name || !phone || !interest) {
        bookingForm.reportValidity();
        return;
      }

      // Persiste o lead no painel antes de abrir o WhatsApp.
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, interest, message })
        });
      } catch (error) {
        console.warn("Não foi possível registrar o lead no painel:", error);
      }

      const whatsappMessage = [
        "Olá! Gostaria de solicitar um agendamento no Ateliê Natália Huebra.",
        "",
        `Nome: ${name}`,
        `Telefone/WhatsApp: ${phone}`,
        `Interesse: ${interest}`,
        email ? `E-mail: ${email}` : "",
        message ? `Mensagem: ${message}` : ""
      ]
        .filter(Boolean)
        .join("\n");

      openWhatsApp(whatsappMessage);
    });
  }

  /* =========================================================
     YOUTUBE
  ========================================================= */

  const youtubeChannel =
    document.getElementById("youtubeChannel");

  if (youtubeChannel) {
    youtubeChannel.addEventListener("click", () => {
      const channelUrl =
        youtubeChannel.dataset.url?.trim() || "";

      if (!channelUrl) {
        alert(
          "O canal do YouTube ainda não foi configurado."
        );
        return;
      }

      window.open(
        channelUrl,
        "_blank",
        "noopener,noreferrer"
      );
    });
  }

  /* =========================================================
     TECLADO / MODAIS
  ========================================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      if (lightbox?.classList.contains("open")) {
        if (event.key === "ArrowLeft") {
          showImage(currentImage - 1);
        }

        if (event.key === "ArrowRight") {
          showImage(currentImage + 1);
        }
      }

      return;
    }

    if (lightbox?.classList.contains("open")) {
      closeLightbox();
      return;
    }

    if (videoModal?.classList.contains("open")) {
      closeVideoModal();
    }
  });

  /* =========================================================
     IMAGENS — FALLBACK
  ========================================================= */

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        image.classList.add("image-load-error");

        console.warn(
          `Imagem não encontrada: ${image.currentSrc || image.src}`
        );
      },
      { once: true }
    );
  });

  hydratePublicSite();

  /* =========================================================
     ANO DO RODAPÉ
  ========================================================= */

  const currentYear =
    document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }
});
