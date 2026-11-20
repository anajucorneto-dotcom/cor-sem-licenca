/* =========================================================
   COR SEM LICENÇA · interações
   ========================================================= */
(() => {
  "use strict";

  const doc = document.documentElement;
  doc.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- fotos: fallback para o original e fotos que ainda não estão na pasta ---------- */
  // Se a versão .webp não existir, usa o arquivo original; se nem o original existir, esconde a foto.
  function fallbackImage(img) {
    const original = img.dataset.original;
    if (original && !img.dataset.triedOriginal) {
      img.dataset.triedOriginal = "1";
      img.removeAttribute("srcset");
      const source = img.closest("picture")?.querySelector("source");
      if (source) source.remove();
      img.src = original;
      return true;
    }
    return false;
  }

  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (!fallbackImage(img)) {
      const fig = img.closest(".shot, .reel__item");
      if (fig) { fig.hidden = true; fig.remove(); rebuildGallery(); }
    }
  }, true);

  async function exists(url) {
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      return r.ok;
    } catch {
      return null; // sem servidor (file://): não dá para checar, deixa o navegador tentar
    }
  }

  async function checkPhotos() {
    const imgs = $$(".shot img");
    await Promise.all(imgs.map(async (img) => {
      const webp = await exists(img.currentSrc || img.getAttribute("src"));
      if (webp !== false) return;
      const orig = await exists(img.dataset.original);
      if (orig === false) {
        img.closest(".shot")?.remove();
      } else {
        fallbackImage(img);
      }
    }));
  }

  /* ---------- menu mobile ---------- */
  const burger = $(".burger");
  const nav = $("#menu");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    burger.querySelector(".visually-hidden").textContent = open ? "Fechar menu" : "Abrir menu";
    nav.classList.toggle("is-open", open);
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); burger.focus(); }
  });

  /* ---------- reveal com giro aleatório ---------- */
  function setupReveal() {
    const items = $$(".reveal");
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    items.forEach((el) => {
      const r = (Math.random() * 6 - 3).toFixed(2);
      el.style.setProperty("--rot", `${r * 2}deg`);
      // fotos ficam levemente tortas, como jogadas na mesa; textos voltam retos
      const isPhoto = el.classList.contains("shot");
      el.style.setProperty("--rot-end", isPhoto ? `${(r * 0.35).toFixed(2)}deg` : "0deg");
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- cor de fundo muda por seção + link ativo ---------- */
  function setupBackground() {
    const sections = $$("[data-bg]");
    const links = $$(".nav a");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const s = en.target;
        document.body.style.setProperty("--bg", s.dataset.bg);
        const id = s.id;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- parallax leve nos grafismos ---------- */
  function setupParallax() {
    if (reduceMotion.matches) return;
    const els = $$("[data-parallax]");
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      els.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- inclinação 3D seguindo o mouse ---------- */
  function setupTilt() {
    if (reduceMotion.matches || !finePointer.matches) return;
    document.addEventListener("pointermove", (e) => {
      const shot = e.target.closest?.(".shot");
      if (!shot) return;
      const r = shot.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      shot.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
      shot.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
    });
    document.addEventListener("pointerout", (e) => {
      const shot = e.target.closest?.(".shot");
      if (shot && !shot.contains(e.relatedTarget)) {
        shot.style.removeProperty("--rx");
        shot.style.removeProperty("--ry");
      }
    });
  }

  /* ---------- cursor estrela (opcional, só com mouse) ---------- */
  function setupCursor() {
    if (reduceMotion.matches || !finePointer.matches) return;
    const star = $(".star-cursor");
    const toggle = $("#cursorToggle");
    let on = true;
    try { on = localStorage.getItem("starCursor") !== "off"; } catch {}
    const apply = () => {
      doc.classList.toggle("has-star-cursor", on);
      toggle.setAttribute("aria-pressed", String(on));
      toggle.textContent = `cursor estrela: ${on ? "ligado" : "desligado"}`;
    };
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      on = !on;
      try { localStorage.setItem("starCursor", on ? "on" : "off"); } catch {}
      apply();
    });
    apply();
    doc.classList.remove("has-star-cursor");
    window.addEventListener("pointermove", () => apply(), { once: true });
    let tx = -50, ty = -50, x = -50, y = -50;
    window.addEventListener("pointermove", (e) => { tx = e.clientX + 12; ty = e.clientY + 12; }, { passive: true });
    const loop = () => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      star.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- galeria: lista de fotos (lightbox + carrossel) ---------- */
  let gallery = [];

  function collect() {
    return $$(".chapter .shot").map((fig) => {
      const img = fig.querySelector("img");
      const chapter = fig.closest(".chapter");
      return {
        fig,
        img,
        btn: fig.querySelector(".shot__btn"),
        alt: img.alt,
        tag: fig.querySelector(".tag")?.textContent || "",
        ref: fig.querySelector(".ref")?.textContent || "",
        desc: fig.querySelector("figcaption em")?.textContent || "",
        color: chapter?.dataset.color || "#F4A6C0",
        name: chapter?.dataset.name || "",
      };
    });
  }

  function largeSrc(img) {
    if (img.dataset.triedOriginal) return img.dataset.original;
    const set = img.getAttribute("srcset");
    if (!set) return img.currentSrc || img.src;
    const last = set.split(",").map((s) => s.trim().split(" ")[0]).pop();
    return last;
  }

  function buildReel() {
    const track = $("#reelTrack");
    track.innerHTML = "";
    const make = (item, i, clone) => {
      const li = document.createElement("li");
      li.className = "reel__item";
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Ampliar ${item.tag}, coleção ${item.name}`);
      if (clone) { li.setAttribute("aria-hidden", "true"); b.tabIndex = -1; }
      const im = document.createElement("img");
      const small = item.img.dataset.triedOriginal ? item.img.dataset.original
        : (item.img.getAttribute("srcset") || "").split(",")[0].trim().split(" ")[0] || item.img.src;
      im.src = small;
      im.alt = clone ? "" : item.alt;
      im.loading = "lazy";
      im.decoding = "async";
      im.width = item.img.width || 400;
      im.height = item.img.height || 600;
      im.dataset.original = item.img.dataset.original;
      b.appendChild(im);
      b.addEventListener("click", () => openLightbox(i, b));
      li.appendChild(b);
      track.appendChild(li);
    };
    gallery.forEach((it, i) => make(it, i, false));
    gallery.forEach((it, i) => make(it, i, true)); // cópia para o loop infinito
  }

  function rebuildGallery() {
    gallery = collect();
    gallery.forEach((item, i) => {
      item.btn.setAttribute("aria-label", `Ampliar foto ${String(i + 1).padStart(2, "0")}: ${item.tag}, coleção ${item.name}`);
      item.btn.onclick = () => openLightbox(i, item.btn);
    });
    buildReel();
  }

  /* ---------- lightbox ---------- */
  const lb = $("#lightbox");
  const lbImg = $(".lb__img", lb);
  let current = 0;
  let opener = null;

  function render(dir = 0) {
    const item = gallery[current];
    if (!item) return;
    const pad = (n) => String(n).padStart(2, "0");
    lb.style.setProperty("--lb-bg", item.color);
    lbImg.classList.remove("is-swapping");
    void lbImg.offsetWidth;
    lbImg.style.setProperty("--dir", `${dir * 30}px`);
    if (dir) lbImg.classList.add("is-swapping");
    lbImg.onerror = () => { if (item.img.dataset.original && lbImg.src.indexOf(item.img.dataset.original) === -1) lbImg.src = item.img.dataset.original; };
    lbImg.src = largeSrc(item.img);
    lbImg.alt = item.alt;
    $(".lb__count", lb).textContent = `${pad(current + 1)} / ${pad(gallery.length)}`;
    $(".lb__tags", lb).textContent = `${item.tag} · ${item.ref}`;
    $(".lb__desc", lb).textContent = item.desc;
    $(".lb__col", lb).textContent = item.name;
    // pré-carrega a vizinha
    const next = gallery[(current + 1) % gallery.length];
    if (next) { const pre = new Image(); pre.src = largeSrc(next.img); }
  }

  function openLightbox(i, from) {
    current = i;
    opener = from || null;
    render(0);
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    doc.classList.add("lb-open");
    $(".lb__close", lb).focus();
  }
  function closeLightbox() {
    if (lb.open) lb.close();
  }
  const go = (d) => { current = (current + d + gallery.length) % gallery.length; render(d); };

  lb.addEventListener("close", () => {
    doc.classList.remove("lb-open");
    if (opener && document.contains(opener)) opener.focus();
  });
  $(".lb__close", lb).addEventListener("click", closeLightbox);
  $(".lb__prev", lb).addEventListener("click", () => go(-1));
  $(".lb__next", lb).addEventListener("click", () => go(1));
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb__frame")) closeLightbox(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  // swipe no celular
  let sx = 0, sy = 0, st = 0;
  lb.addEventListener("touchstart", (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - st < 700) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ---------- contador de visitas fake ---------- */
  function setupCounter() {
    const el = $("#counter");
    const target = 2000;
    const draw = (n) => {
      const s = String(n).padStart(6, "0");
      el.querySelectorAll("b").forEach((b, i) => { b.textContent = s[i]; });
    };
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return draw(target);
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1600);
        draw(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      draw(0);
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
  }

  /* ---------- carrossel: pausa ao tocar (celular) ---------- */
  $(".reel__viewport").addEventListener("touchstart", () => $("#reelTrack").classList.toggle("is-paused"), { passive: true });

  /* ---------- início ---------- */
  rebuildGallery();
  setupReveal();
  setupBackground();
  setupParallax();
  setupTilt();
  setupCursor();
  setupCounter();
  checkPhotos().then(rebuildGallery);
})();
