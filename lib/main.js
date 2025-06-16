document.addEventListener('DOMContentLoaded', function() {
    const coffeeShopCard = document.getElementById('coffee-shop-card');

    if (coffeeShopCard) {
        coffeeShopCard.addEventListener('click', function() {
            // Navigate to the coffee shop game page
            window.location.href = './coffeeshop/coffeeShop.html';
        });
    } else {
        console.warn('Coffee Shop card not found on this page.');
    }
});
// This script adds an event listener to the coffee shop card
// that redirects the user to the coffee shop game page when clicked.