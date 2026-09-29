// Поп-апы: кнопки с data-open="id" открывают <dialog id="id">.
// Без JS ссылки ведут на исходный документ (PDF, изображение).
(() => {
  const open = (id) => {
    const d = document.getElementById(id);
    if (!d || typeof d.showModal !== "function") return false;
    d.showModal();
    return true;
  };

  // Тема: тёмная по умолчанию, светлая — по выбору; выбор запоминается.
  const setTheme = (t) => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
    syncToggle();
    document.dispatchEvent(new Event("themechange"));
  };
  const syncToggle = () => document.querySelectorAll("[data-theme-toggle]").forEach((b) =>
    b.setAttribute("aria-label", document.documentElement.dataset.theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"));
  syncToggle();

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-open]");
    if (trigger && open(trigger.dataset.open)) e.preventDefault();

    const toggle = e.target.closest("[data-theme-toggle]");
    if (toggle) setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");

    const closer = e.target.closest("[data-close]");
    if (closer) closer.closest("dialog").close();
  });

  // клик по затемнению закрывает окно
  document.querySelectorAll("dialog.modal").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    d.addEventListener("close", () => {
      if (location.hash === "#" + d.id) history.replaceState(null, "", location.pathname);
    });
  });

  // index.html#resume открывает резюме сразу (ссылка со страниц кейсов)
  const id = location.hash.slice(1);
  if (id && document.getElementById(id)?.tagName === "DIALOG") open(id);

  // Просмотр картинок кейса крупно: <main data-zoom> — все картинки в <figure>.
  // Стрелки и ←/→ листают, клик по картинке — реальный размер, Esc закрывает.
  const pics = [...document.querySelectorAll("main[data-zoom] figure img")];
  if (pics.length) {
    const box = document.createElement("dialog");
    box.className = "lightbox";
    box.setAttribute("aria-label", "Просмотр изображения");
    box.innerHTML = `
      <div class="lightbox__stage"><img alt=""></div>
      <p class="lightbox__cap"><span></span><small></small></p>
      <button class="close lightbox__close" type="button" data-close aria-label="Закрыть" autofocus><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg></button>
      <button class="close lightbox__nav lightbox__prev" type="button" aria-label="Предыдущее изображение"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg></button>
      <button class="close lightbox__nav lightbox__next" type="button" aria-label="Следующее изображение"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg></button>`;
    document.body.append(box);
    const stage = box.querySelector(".lightbox__stage");
    const big = stage.querySelector("img");
    const cap = box.querySelector(".lightbox__cap span");
    const count = box.querySelector(".lightbox__cap small");
    let cur = 0;

    const show = (i) => {
      cur = (i + pics.length) % pics.length;
      const p = pics[cur];
      box.classList.remove("is-zoomed");
      big.src = p.currentSrc || p.src;
      big.alt = p.alt;
      cap.textContent = p.closest("figure").querySelector("figcaption")?.textContent || p.alt;
      count.textContent = `${cur + 1} / ${pics.length}`;
    };

    pics.forEach((p, i) => {
      p.tabIndex = 0;
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", `Открыть крупно: ${p.alt}`);
      const go = () => { show(i); box.showModal(); };
      p.addEventListener("click", go);
      p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });

    box.querySelector(".lightbox__prev").addEventListener("click", () => show(cur - 1));
    box.querySelector(".lightbox__next").addEventListener("click", () => show(cur + 1));
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
    // клик мимо картинки закрывает, по картинке — реальный размер (если она больше экрана)
    box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
    stage.addEventListener("click", (e) => {
      if (e.target !== big) return box.close();
      const fits = big.naturalWidth <= stage.clientWidth && big.naturalHeight <= stage.clientHeight;
      if (!fits || box.classList.contains("is-zoomed")) box.classList.toggle("is-zoomed");
    });
  }
})();
