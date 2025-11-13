$(document).ready(function() {
    let cart = [];
    let discount = 0;

    try {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }

    // Initialize cart if it doesn't exist
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }

    updateCartCount();

    // Добавление товара
    $('.add-to-cart').click(function() {
        const name = $(this).data('name');
        const price = parseFloat($(this).data('price'));
        
        // Get fresh cart data from localStorage
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ name, price, quantity: 1 });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        $(this).text('Added!').prop('disabled', true);
        setTimeout(() => $(this).text('Add to Cart').prop('disabled', false), 1000);
        
        showNotification('Item added to cart!');
    });

    function updateCartCount() {
        try {
            const cartData = JSON.parse(localStorage.getItem('cart')) || [];
            const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
            $('#cartCount').text(totalItems);
        } catch (error) {
            console.error('Error updating cart count:', error);
            $('#cartCount').text('0');
        }
    }

    function showNotification(message) {
        const notification = $('<div class="alert alert-success" style="position: fixed; top: 80px; right: 20px; z-index: 9999;">' + message + '</div>');
        $('body').append(notification);
        setTimeout(() => notification.fadeOut(() => notification.remove()), 2000);
    }

    // Check which page we're on and initialize appropriate functionality
    const currentPath = window.location.pathname;
    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    // Initialize page-specific functionality
    if (currentFile === 'cart.html') {
        // We're on the cart page
        displayCart();
    } else if (currentFile === 'contact.html') {
        // We're on the contact page
        // Initialize contact form if needed
    } else if (currentFile === 'products.html') {
        // We're on the products page
        // Initialize product filters
        function filterAndSortProducts() {
            // gather active categories
            const activeCats = $('.filter-checkbox:checked').map(function(){ return $(this).val(); }).get();
            const priceRange = $('#priceFilter').val();
            const sortBy = $('#sortFilter').val();

            const items = $('.product-item').get();

            // filter
            items.forEach(function(el){
                const $el = $(el);
                const cat = $el.data('category');
                const price = parseFloat($el.data('price')) || 0;

                let show = activeCats.indexOf(cat) !== -1;

                if(show && priceRange && priceRange !== 'all'){
                    const parts = priceRange.split('-');
                    const min = parseFloat(parts[0]) || 0;
                    const max = parseFloat(parts[1]) || Infinity;
                    if(!(price >= min && price <= max)) show = false;
                }

                $el.toggle(show);
            });

            // sort - operate on visible items only
            const $grid = $('#productsGrid');
            let $visible = $grid.find('.product-item:visible');
            $visible = $visible.get().sort(function(a,b){
                const $a = $(a), $b = $(b);
                const pa = parseFloat($a.data('price')) || 0;
                const pb = parseFloat($b.data('price')) || 0;
                const na = $a.find('h4').text().toLowerCase();
                const nb = $b.find('h4').text().toLowerCase();

                if(sortBy === 'price-low') return pa - pb;
                if(sortBy === 'price-high') return pb - pa;
                if(sortBy === 'name') return na < nb ? -1 : (na > nb ? 1 : 0);
                return 0; // featured/default
            });

            // append in sorted order - keep hidden items where they are
            $visible.forEach(function(node){ $grid.append(node); });
        }

        // wire up filter UI
        $(document).on('change', '.filter-checkbox, #priceFilter, #sortFilter', function(){
            filterAndSortProducts();
        });

        // run once on load to apply current filter state
        $(function(){ filterAndSortProducts(); });
    }

    function displayCart() {
        const cartItemsContainer = $('#cartItems');
        const emptyCart = $('#emptyCart');
        
        // Refresh cart from localStorage
        cart = JSON.parse(localStorage.getItem('cart')) || [];

        if (!cart || cart.length === 0) {
            cartItemsContainer.hide();
            emptyCart.show();
            updateCartSummary();
            return;
        }

        cartItemsContainer.empty().show();
        emptyCart.hide();

        cart.forEach((item, index) => {
            const itemHTML = `
                <div class="cart-item">
                    <div class="cart-item-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn decrease-qty" data-index="${index}" aria-label="Decrease quantity">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn increase-qty" data-index="${index}" aria-label="Increase quantity">+</button>
                        </div>
                    </div>
                    <button class="btn btn-danger btn-sm remove-item" data-index="${index}" aria-label="Remove item">Remove</button>
                </div>
            `;
            cartItemsContainer.append(itemHTML);
        });

        updateCartSummary();
    }

    $(document).on('click', '.increase-qty', function() {
        const index = $(this).data('index');
        cart[index].quantity++;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCount();
    });

    $(document).on('click', '.decrease-qty', function() {
        const index = $(this).data('index');
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            localStorage.setItem('cart', JSON.stringify(cart));
            displayCart();
            updateCartCount();
        }
    });

    $(document).on('click', '.remove-item', function() {
        const index = $(this).data('index');
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCount();
    });

    function updateCartSummary() {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = subtotal > 50 ? 0 : 10;
        const tax = subtotal * 0.1;
        const total = subtotal + shipping + tax - discount;

        $('#subtotal').text('$' + subtotal.toFixed(2));
        $('#shipping').text('$' + shipping.toFixed(2));
        $('#tax').text('$' + tax.toFixed(2));
        $('#discount').text('$' + discount.toFixed(2));
        $('#total').text('$' + total.toFixed(2));
    }

    $('#applyPromo').click(function() {
        const code = $('#promoCode').val().toUpperCase();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (code === 'GAMER10' && subtotal > 0) {
            discount = subtotal * 0.1;
            $('#promoMessage').text('Promo code applied! 10% discount').removeClass('text-danger').addClass('text-success').show();
            $(this).prop('disabled', true);
        } else if (code) {
            $('#promoMessage').text('Invalid promo code').removeClass('text-success').addClass('text-danger').show();
        }

        updateCartSummary();
    });

    $('#placeOrder').click(function() {
        const form = $('#checkoutForm')[0];
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const orderId = 'PG' + Math.random().toString(36).substr(2, 9).toUpperCase();
        $('#orderId').text(orderId);

        cart = [];
        discount = 0;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();

        $('#checkoutModal').modal('hide');
        $('#successModal').modal('show');

        form.reset();
        form.classList.remove('was-validated');
        displayCart();
    });

    // Сброс модального окна успеха и редирект
    $('#successModal').on('hidden.bs.modal', function() {
        window.location.href = 'index.html';
    });

    // Safety fallback: ensure Shop Now links inside hero slides always navigate
    $(document).on('click touchstart', '.hero-slide a.btn, .hero-slide .btn.btn-primary', function(e){
        try {
            const href = $(this).attr('href');
            if(href && href !== '#'){
                // allow default behavior, but force navigation shortly after in case click was blocked
                setTimeout(function(){ window.location.href = href; }, 100);
            }
        } catch(err){ /* ignore */ }
    });
});

// === Dark Mode Toggle + APIs ===
(function(){
  function updateButtonText(isDark){
    var btn=document.getElementById('darkModeToggle');
    if(btn) btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  var saved = localStorage.getItem('theme');
  if(saved === 'dark'){
    document.documentElement.setAttribute('data-theme','dark');
    updateButtonText(true);
  } else {
    updateButtonText(false);
  }

  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'darkModeToggle'){
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if(isDark){
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme','light');
        updateButtonText(false);
      } else {
        document.documentElement.setAttribute('data-theme','dark');
        localStorage.setItem('theme','dark');
        updateButtonText(true);
      }
    }
  });

  // Quotes
  async function fetchQuote(){
    const el = document.getElementById('quote-text'); if(!el) return;
    el.textContent = 'Loading quote...';
    try{
      const r = await fetch('https://api.quotable.io/random?maxLength=120');
      if(!r.ok) throw new Error('API');
      const data = await r.json(); el.textContent = `"${data.content}" — ${data.author||'Unknown'}`;
    } catch(err){
      const fallback=["The cake is a lie.","Finish him!","War. War never changes."];
      el.textContent = fallback[Math.floor(Math.random()*fallback.length)];
    }
  }

  // Weather
  function fetchWeather(){
    const el = document.getElementById('weather-text'); if(!el) return;
    el.textContent = 'Detecting location...';
    function show(lat,lon){
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(r=>r.json()).then(d=>{
          if(d && d.current_weather){ el.textContent = `Temp: ${d.current_weather.temperature}°C, Wind: ${d.current_weather.windspeed} km/h`; }
          else el.textContent = 'Weather not available';
        }).catch(()=>el.textContent='Weather fetch error');
    }
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(function(pos){ show(pos.coords.latitude,pos.coords.longitude); }, function(){ show(55.75,37.61); });
    } else { show(55.75,37.61); }
  }

  document.addEventListener('DOMContentLoaded', function(){
    const nq = document.getElementById('new-quote-btn'); if(nq) { nq.addEventListener('click', fetchQuote); }
    fetchQuote(); fetchWeather();
  });

})();
