// Движение: появление блоков при прокрутке, наклон обложек, портрет, который следит за курсором,
// а в кейсах — полоса чтения, «наезд» на обложку и телефоны, которые встают по очереди.
// Чтобы убрать всё разом на странице — удалите из неё тег <script src="motion.js">.
// При prefers-reduced-motion ничего не включается. Стили — в style.css, блок «Движение».
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("js-motion");

  // Блоки всплывают по мере прокрутки; соседи в одном ряду — по очереди.
  const targets = ".section__head, .case, .minor__item, .flow li, .legend, .skills section, .about > *, .edu-title, .edu li, .contact__mail, .links li, "
    + ".back, .cs-intro > *, .cover, .cs-cols > *, .fig, .stage, .sub, .outcomes__stage, .more, .next";
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

  // Кейсы: телефоны в ленте встают по очереди, когда плашка появилась.
  document.querySelectorAll(".screens").forEach((strip) =>
    [...strip.children].forEach((f, n) => f.style.setProperty("--n", Math.min(n, 6))));

  // Кейсы: полоса чтения под шапкой и плавный «наезд» на обложку при прокрутке.
  const cover = document.querySelector(".cover");
  if (document.querySelector(".cs-hero")) {
    const bar = document.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.append(bar);
    let queued = false;
    const onScroll = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
      if (cover) {
        const r = cover.getBoundingClientRect();
        const t = Math.min(Math.max((innerHeight - r.top) / (innerHeight + r.height), 0), 1);
        cover.style.setProperty("--z", 1.16 - 0.16 * t);
      }
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();
  }

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
