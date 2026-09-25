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
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
      document.body.classList.remove('menu-open');
    }));
  }

  const productForm = document.querySelector('[data-product-form]');
  const variantsElement = document.querySelector('[data-product-variants]');
  const variantIdInput = document.querySelector('[data-variant-id]');
  const priceElement = document.querySelector('[data-product-price]');
  const compareElement = document.querySelector('[data-product-compare-price]');
  const unitPriceElement = document.querySelector('[data-product-unit-price]');
  const addButton = document.querySelector('[data-add-to-cart]');
  if (!productForm || !variantsElement || !variantIdInput) return;

  let variants = [];
  try { variants = JSON.parse(variantsElement.textContent); } catch (error) { return; }

  const selectors = [...productForm.querySelectorAll('[data-option-index]')];
  const galleryItems = [...document.querySelectorAll('[data-media-id]')];
  const formatMoney = (cents) => {
    const currency = document.documentElement.dataset.currency;
    if (!currency || typeof cents !== 'number') return '';
    return new Intl.NumberFormat(document.documentElement.lang || undefined, { style: 'currency', currency }).format(cents / 100);
  };

  const findVariant = () => {
    const selected = selectors.map((select) => select.value);
    return variants.find((variant) => variant.options.every((option, index) => option === selected[index]));
  };

  const updateVariant = () => {
    const variant = findVariant();
    if (!variant) return;
    variantIdInput.value = variant.id;

    if (priceElement) priceElement.textContent = formatMoney(variant.price);
    if (compareElement) compareElement.innerHTML = variant.compare_at_price > variant.price ? '<s>' + formatMoney(variant.compare_at_price) + '</s>' : '';

    if (unitPriceElement) {
      if (variant.unit_price) {
        const measurement = variant.unit_price_measurement;
        const reference = measurement && measurement.reference_value !== 1 ? measurement.reference_value + ' ' : '';
        unitPriceElement.textContent = formatMoney(variant.unit_price) + ' / ' + reference + (measurement ? measurement.reference_unit : '');
      } else {
        unitPriceElement.textContent = '';
      }
    }

    if (addButton) {
      addButton.disabled = !variant.available;
      addButton.textContent = variant.available ? 'Add to cart' : 'Sold out';
    }

    if (variant.featured_media && variant.featured_media.id) {
      galleryItems.forEach((item) => {
        item.hidden = false;
        if (item.dataset.mediaId === String(variant.featured_media.id)) {
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  };

  selectors.forEach((select) => select.addEventListener('change', updateVariant));
  updateVariant();
})();