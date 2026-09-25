(() => {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      mobileMenu.hidden = expanded;
      document.body.classList.toggle('menu-open', !expanded);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.hidden = true;
        document.body.classList.remove('menu-open');
      });
    });
  }

  const productForm = document.querySelector('[data-product-form]');
  const variantsElement = document.querySelector('[data-product-variants]');
  const variantIdInput = document.querySelector('[data-variant-id]');
  const priceElement = document.querySelector('[data-product-price]');
  const addButton = document.querySelector('[data-add-to-cart]');

  if (!productForm || !variantsElement || !variantIdInput) return;

  let variants = [];

  try {
    variants = JSON.parse(variantsElement.textContent);
  } catch (error) {
    return;
  }

  const selectors = [...productForm.querySelectorAll('[data-option-index]')];

  const findVariant = () => {
    const selected = selectors.map((select) => select.value);

    return variants.find((variant) =>
      variant.options.every((option, index) => option === selected[index])
    );
  };

  const updateVariant = () => {
    const variant = findVariant();
    if (!variant) return;

    variantIdInput.value = variant.id;

    if (priceElement && variant.price) {
      const money = new Intl.NumberFormat(document.documentElement.lang || undefined, {
        style: 'currency',
        currency: '{{ shop.currency }}'
      }).format(variant.price / 100);

      priceElement.textContent = money;
    }

    if (addButton) {
      addButton.disabled = !variant.available;
      addButton.textContent = variant.available ? 'Add to cart' : 'Sold out';
    }
  };

  selectors.forEach((select) => {
    select.addEventListener('change', updateVariant);
  });
})();
