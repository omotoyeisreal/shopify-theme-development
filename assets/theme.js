(() => {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (menuToggle && mobileMenu) {
    mobileMenu.hidden = true;
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

  document.querySelectorAll('[data-product-recommendations][data-url]').forEach((container) => {
    fetch(container.dataset.url)
      .then((response) => response.text())
      .then((html) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const content = wrapper.querySelector('[data-recommendations-content]');
        if (content && content.innerHTML.trim()) container.innerHTML = content.outerHTML;
      })
      .catch(() => {});
  });

  const predictiveInputs = document.querySelectorAll('[data-predictive-search]');
  predictiveInputs.forEach((input) => {
    const wrapper = input.closest('form');
    let results;
    let timer;
    let activeIndex = -1;

    const setExpanded = (expanded) => {
      input.setAttribute('aria-expanded', String(expanded));
      if (results) results.hidden = !expanded;
    };

    const clearResults = () => {
      activeIndex = -1;
      setExpanded(false);
      if (results) results.replaceChildren();
    };

    const setActiveResult = (index) => {
      if (!results) return;
      const options = [...results.querySelectorAll('[role="option"]')];
      options.forEach((option, optionIndex) => {
        option.setAttribute('aria-selected', String(optionIndex === index));
      });
      activeIndex = index;
      if (index >= 0 && options[index]) {
        input.setAttribute('aria-activedescendant', options[index].id);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    };

    input.addEventListener('keydown', (event) => {
      if (!results || results.hidden) return;
      const options = [...results.querySelectorAll('[role="option"]')];
      if (!options.length) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveResult(activeIndex < options.length - 1 ? activeIndex + 1 : 0);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveResult(activeIndex > 0 ? activeIndex - 1 : options.length - 1);
      } else if (event.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
        event.preventDefault();
        options[activeIndex].click();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        clearResults();
      }
    });

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const query = input.value.trim();
      input.removeAttribute('aria-activedescendant');

      if (query.length < 2) {
        clearResults();
        return;
      }

      timer = setTimeout(() => {
        const root = window.Shopify?.routes?.root || '/';
        const url = root + 'search/suggest.json?q=' + encodeURIComponent(query) + '&resources[type]=product,collection,article,page&resources[limit]=4';

        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            const resources = data.resources?.results || {};
            const products = resources.products || [];
            const collections = resources.collections || [];
            const articles = resources.articles || [];
            const pages = resources.pages || [];

            if (!results) {
              results = document.createElement('div');
              results.id = 'PredictiveSearch-' + input.id;
              results.className = 'predictive-search';
              results.setAttribute('role', 'listbox');
              wrapper.appendChild(results);
              input.setAttribute('aria-controls', results.id);
            }

            const items = [
              ...products.map((item) => ({ url: item.url, title: item.title })),
              ...collections.map((item) => ({ url: item.url, title: item.title })),
              ...articles.map((item) => ({ url: item.url, title: item.title })),
              ...pages.map((item) => ({ url: item.url, title: item.title }))
            ].slice(0, 10);

            results.replaceChildren();
            activeIndex = -1;

            if (items.length) {
              const heading = document.createElement('strong');
              heading.textContent = 'Suggestions';
              results.appendChild(heading);

              items.forEach((item, index) => {
                const link = document.createElement('a');
                link.id = results.id + '-option-' + index;
                link.href = item.url;
                link.textContent = item.title;
                link.setAttribute('role', 'option');
                link.setAttribute('aria-selected', 'false');
                results.appendChild(link);
              });

              setExpanded(true);
            } else {
              clearResults();
            }
          })
          .catch(() => {
            clearResults();
          });
      }, 180);
    });
  });

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
  const productRequiresSellingPlan = productForm.dataset.requiresSellingPlan === 'true';
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

  const updatePickupAvailability = (variantId) => {
    const container = document.querySelector('[data-store-availability-container]');
    if (!container || !variantId || !window.Shopify?.routes?.root) return;
    const url = window.Shopify.routes.root + 'variants/' + variantId + '/?section_id=pickup-availability';
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const section = doc.querySelector('.shopify-section');
        container.replaceChildren();
        if (section && section.textContent.trim()) container.appendChild(section);
      })
      .catch(() => { container.replaceChildren(); });
  };

  const updateSellingPlanAvailability = (variant) => {
    const sellingPlanInputs = [...productForm.querySelectorAll('input[name="selling_plan"]')];
    if (!sellingPlanInputs.length) return;

    const allocations = Array.isArray(variant.selling_plan_allocations) ? variant.selling_plan_allocations : [];
    const availablePlanIds = new Set(allocations.map((allocation) => String(allocation.selling_plan_id)));
    let selectedAvailable = false;

    sellingPlanInputs.forEach((input) => {
      const isOneTime = input.value === '';
      const available = isOneTime ? !productRequiresSellingPlan : availablePlanIds.has(String(input.value));
      input.disabled = !available;
      const label = input.closest('label');
      if (label) label.hidden = !available;
      if (available && input.checked) selectedAvailable = true;
    });

    if (!selectedAvailable) {
      const fallback = sellingPlanInputs.find((input) => !input.disabled);
      if (fallback) fallback.checked = true;
    }
  };

  const updateVariant = () => {
    const variant = findVariant();
    if (!variant) return;
    variantIdInput.value = variant.id;
    updateSellingPlanAvailability(variant);
    updatePickupAvailability(variant.id);

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

    document.querySelectorAll('[data-swatch-option][data-swatch-value]').forEach((swatch) => {
      const select = selectors.find((item) => item.name === 'options[' + swatch.dataset.swatchOption + ']');
      swatch.setAttribute('aria-pressed', String(select && select.value === swatch.dataset.swatchValue));
    });

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

  document.querySelectorAll('[data-swatch-option][data-swatch-value]').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const select = selectors.find((item) => item.name === 'options[' + swatch.dataset.swatchOption + ']');
      if (select) {
        select.value = swatch.dataset.swatchValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  selectors.forEach((select) => select.addEventListener('change', updateVariant));
  updateVariant();
})();