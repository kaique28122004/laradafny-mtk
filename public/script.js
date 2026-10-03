/* =========================================================
   LARA DAFNY — Interações
   JavaScript puro, sem dependências
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- Preloader + animação de entrada ---------- */
  document.body.classList.add("is-loading");
  const finishLoading = () => {
    $("#preloader")?.classList.add("is-done");
    document.body.classList.remove("is-loading");
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  };
  window.addEventListener("load", () => setTimeout(finishLoading, prefersReducedMotion ? 0 : 1300));
  setTimeout(finishLoading, 4000); // segurança caso algum recurso demore

  /* ---------- Tema claro / escuro ---------- */
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("ld-theme");
  if (savedTheme) root.dataset.theme = savedTheme;
  $("#themeToggle").addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("ld-theme", next);
    $('meta[name="theme-color"]').setAttribute("content", next === "dark" ? "#0d0a0c" : "#f7f1ec");
  });

  /* ---------- Menu mobile ---------- */
  const burger = $("#burger");
  const navLinks = $("#navLinks");
  const toggleMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    navLinks.classList.toggle("is-open", open);
  };
  burger.addEventListener("click", () => toggleMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", navLinks).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Scroll: menu, progresso, voltar ao topo, parallax ---------- */
  const nav = $("#nav");
  const toTop = $("#toTop");
  const ring = $("#toTopRing");
  const ringLength = 2 * Math.PI * 22;
  const parallaxEls = $$("[data-parallax]");
  const scaleEls = $$(".scale-on-scroll");
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    nav.classList.toggle("is-scrolled", y > 40);
    const menuOpen = navLinks.classList.contains("is-open");
    nav.classList.toggle("is-hidden", !menuOpen && y > lastY && y > 600);
    lastY = y;

    toTop.classList.toggle("is-visible", y > 700);
    ring.style.strokeDashoffset = String(ringLength - (y / max) * ringLength);

    if (!prefersReducedMotion) {
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });

      // Zoom suave estilo Apple: a imagem "assenta" conforme entra na tela
      scaleEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const progress = Math.min(Math.max(1 - rect.top / window.innerHeight, 0), 1);
        el.querySelector("img").style.setProperty("--s", String(1.15 - progress * 0.15));
      });

      updateManifesto();
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Manifesto: palavras acendem conforme a rolagem ---------- */
  const manifesto = $("#manifesto");
  const accentWords = ["extraordinárias", "encantam,", "inspiram", "desejo"];
  manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/).map((w) => {
    const accent = accentWords.includes(w) ? " is-accent" : "";
    return `<span class="word${accent}">${w}</span>`;
  }).join(" ");
  const words = $$(".word", manifesto);

  function updateManifesto() {
    const rect = manifesto.getBoundingClientRect();
    const start = window.innerHeight * 0.85;
    const end = window.innerHeight * 0.3;
    const progress = Math.min(Math.max((start - rect.top) / (start - end + rect.height * 0.5), 0), 1);
    const litCount = Math.round(progress * words.length);
    words.forEach((w, i) => w.classList.toggle("is-lit", i < litCount));
  }
  if (prefersReducedMotion) words.forEach((w) => w.classList.add("is-lit"));

  /* ---------- Link ativo no menu ---------- */
  const sections = $$("main section[id]");
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $$("a", navLinks).forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Scroll reveal ---------- */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- Contadores animados ---------- */
  const formatNumber = (n) => n.toLocaleString("pt-BR");
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2200;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = formatNumber(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  $$(".counter").forEach((el) => counterObserver.observe(el));

  /* ---------- Cards: tilt 3D + brilho que segue o mouse ---------- */
  if (!isTouch && !prefersReducedMotion) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });

    /* Botões magnéticos */
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });

    /* Cursor personalizado */
    const cursor = $("#cursor");
    let cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add("is-visible");
    }, { passive: true });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$("a, button, .project, input, textarea, label").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Portfólio: modal ---------- */
  const projects = [
    {
      title: "Maison Éclat Skincare", tag: "Social Media", img: "/images/project-1.png",
      desc: "Reposicionamento completo do Instagram de uma marca de skincare de luxo, com nova direção de arte, calendário editorial e estratégia de influenciadoras.",
      stats: [["+320%", "Engajamento"], ["+48k", "Seguidores"], ["3x", "Faturamento"]],
    },
    {
      title: "Atelier Rosé", tag: "Branding", img: "/images/project-2.png",
      desc: "Criação de identidade visual, tom de voz e manual de marca para boutique de moda feminina autoral, do logotipo às embalagens.",
      stats: [["100%", "Rebranding"], ["+65%", "Ticket médio"], ["12", "Peças criadas"]],
    },
    {
      title: "Aurum Joias", tag: "Tráfego Pago", img: "/images/project-3.png",
      desc: "Estrutura de campanhas no Meta Ads e Google Ads para e-commerce de joias finas, com funil completo e remarketing dinâmico.",
      stats: [["8.2x", "ROAS"], ["-42%", "Custo por venda"], ["+210%", "Vendas"]],
    },
    {
      title: "Clínica Lumière", tag: "Conteúdo", img: "/images/project-4.png",
      desc: "Produção mensal de fotos, vídeos e roteiros para clínica de estética premium, fortalecendo autoridade e humanização da marca.",
      stats: [["+1.2M", "Visualizações"], ["+90", "Agendamentos/mês"], ["40", "Reels/mês"]],
    },
    {
      title: "Noir Parfum", tag: "Lançamento", img: "/images/project-5.png",
      desc: "Estratégia de lançamento 360º para perfumaria de nicho: teasers, lista de espera, evento digital e campanha de stories.",
      stats: [["2.400", "Lista de espera"], ["72h", "Esgotado"], ["+5M", "Alcance"]],
    },
    {
      title: "Villa Serena Resort", tag: "Consultoria", img: "/images/project-6.png",
      desc: "Consultoria estratégica para resort boutique, com reestruturação do funil de reservas diretas e posicionamento digital de luxo.",
      stats: [["+180%", "Reservas diretas"], ["-35%", "Comissões OTA"], ["6", "Meses"]],
    },
  ];

  const modal = $("#modal");
  let lastFocused = null;

  const openModal = (index) => {
    const p = projects[index];
    $("#modalImg").src = p.img;
    $("#modalImg").alt = p.title;
    $("#modalTitle").textContent = p.title;
    $("#modalTag").textContent = p.tag;
    $("#modalDesc").textContent = p.desc;
    $("#modalStats").innerHTML = p.stats.map(([v, l]) => `<li><strong>${v}</strong><span>${l}</span></li>`).join("");

    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      $(".modal__close", modal).focus();
    });
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { modal.hidden = true; }, 500);
    lastFocused?.focus();
  };

  $$(".project").forEach((btn) => btn.addEventListener("click", () => openModal(Number(btn.dataset.project))));
  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const focusables = $$("button, a[href]", modal);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Carrossel de depoimentos ---------- */
  const track = $("#carouselTrack");
  const slides = $$(".testimonial", track);
  const dotsWrap = $("#carouselDots");
  let current = 0;
  let autoplay;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Ir para depoimento ${i + 1}`);
    dot.addEventListener("click", () => { goTo(i); restart(); });
    dotsWrap.appendChild(dot);
  });
  const dots = $$("button", dotsWrap);

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((s, i) => {
      s.classList.toggle("is-active", i === current);
      s.setAttribute("aria-hidden", String(i !== current));
    });
    dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === current)));
  }
  const next = () => goTo(current + 1);
  const restart = () => {
    clearInterval(autoplay);
    if (!prefersReducedMotion) autoplay = setInterval(next, 6000);
  };

  $("#nextBtn").addEventListener("click", () => { next(); restart(); });
  $("#prevBtn").addEventListener("click", () => { goTo(current - 1); restart(); });
  const carousel = $("#carousel");
  carousel.addEventListener("mouseenter", () => clearInterval(autoplay));
  carousel.addEventListener("mouseleave", restart);

  // Swipe no celular
  let touchX = 0;
  track.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : goTo(current - 1); restart(); }
  });

  goTo(0);
  restart();

  /* ---------- Formulário de contato (validação visual) ---------- */
  const form = $("#contactForm");
  const feedback = $("#formFeedback");
  const submitBtn = $("#submitBtn");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    ["name", "email", "message"].forEach((id) => {
      const input = $(`#${id}`);
      const ok = id === "email" ? emailRegex.test(input.value.trim()) : input.value.trim().length > 1;
      input.parentElement.classList.toggle("is-invalid", !ok);
      if (!ok) valid = false;
    });

    feedback.className = "form__feedback";
    if (!valid) {
      feedback.textContent = "Por favor, preencha os campos destacados corretamente.";
      feedback.classList.add("is-error");
      return;
    }

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;
    setTimeout(() => {
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
      form.reset();
      feedback.textContent = "Mensagem enviada com sucesso! Retornarei em breve. ✦";
      feedback.classList.add("is-success");
    }, 1600);
  });

  $$("input, textarea", form).forEach((el) =>
    el.addEventListener("input", () => el.parentElement.classList.remove("is-invalid"))
  );

  /* ---------- Ano no rodapé ---------- */
  $("#year").textContent = new Date().getFullYear();

  onScroll();
})();
