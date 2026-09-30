// Движение на главной: появление блоков при прокрутке, наклон обложек и портрет, который следит за курсором.
// Подключён только в index.html. Чтобы убрать всё разом — удалите тег <script src="motion.js"> оттуда.
// При prefers-reduced-motion ничего не включается. Стили — в style.css, блок «Движение на главной».
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("js-motion");

  // Блоки всплывают по мере прокрутки; соседи в одном ряду — по очереди.
  const targets = ".section__head, .case, .minor__item, .flow li, .legend, .skills section, .about > *, .edu-title, .edu li, .contact__mail, .links li";
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in");
    io.unobserve(e.target);
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  document.querySelectorAll(targets).forEach((el) => {
    const row = [...el.parentElement.children].filter((c) => c.matches(targets));
    el.style.setProperty("--i", row.indexOf(el) % 3);
    el.dataset.reveal = "";
    io.observe(el);
  });

  if (!matchMedia("(hover: hover)").matches) return;

  // Обложки кейсов: наклон за курсором и блик.
  document.querySelectorAll(".case > .case__media").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${(x - 0.5) * 7}deg`);
      el.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
      el.style.setProperty("--gx", `${x * 100}%`);
      el.style.setProperty("--gy", `${y * 100}%`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });

  // Портрет в первом экране слегка смещается навстречу курсору.
  const photo = document.querySelector(".hero__photo");
  if (photo) addEventListener("pointermove", (e) => {
    if (scrollY > innerHeight) return;
    photo.style.setProperty("--px", `${(e.clientX / innerWidth - 0.5) * -14}px`);
    photo.style.setProperty("--py", `${(e.clientY / innerHeight - 0.5) * -14}px`);
  }, { passive: true });
})();
