var Shopify = Shopify || {};
// ---------------------------------------------------------------------------
// Money format handler
// ---------------------------------------------------------------------------
Shopify.money_format = "${{amount}}";
Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.',''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || this.money_format);

  function defaultOption(opt, def) {
     return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number/100.0).toFixed(precision);

    var parts   = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents   = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
};



class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateVariantInput();
    this.updatePrice();
    this.updateImage();
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });


    this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);   

  }


  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updatePrice() {
    const productPrice = this.offsetParent.querySelector(`#price-${this.dataset.section}`);
    productPrice.innerHTML = Shopify.formatMoney(this.currentVariant.price , window.theme.moneyFormat); 

  }


  updateImage() {
    const upsellImage = this.offsetParent.querySelector(`#upsell-image-${this.dataset.section}`);
    if(this.currentVariant.featured_image != null ){
      upsellImage.querySelector('img').src = this.currentVariant.featured_image.src
      upsellImage.querySelector('img').srcset = this.currentVariant.featured_image.src
    }

  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#productForm-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      // input.dispatchEvent(new Event('change', { bubbles: true }));
    });    
  }


  
  toggleAddButton(disable = true, text, modifyClass = true) {


    const productForm = this.offsetParent.querySelector(`#productForm-${this.dataset.section}`);

    const productPrice = this.offsetParent.querySelector(`#price-${this.dataset.section}`);
  

    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"]  span.js-product-form-submit-btn-text');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart +" - "+Shopify.formatMoney(this.currentVariant.price , window.theme.moneyFormat);
    }

    if (!modifyClass) return;




  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

}
customElements.define('variant-selects', VariantSelects);
