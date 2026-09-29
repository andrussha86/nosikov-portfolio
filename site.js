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
})();
