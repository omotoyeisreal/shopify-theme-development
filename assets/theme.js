(() => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const drawer = document.querySelector('[data-mobile-menu]');

  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    drawer.hidden = expanded;
    document.body.classList.toggle('menu-open', !expanded);
  });

  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      drawer.hidden = true;
      document.body.classList.remove('menu-open');
    });
  });
})();
