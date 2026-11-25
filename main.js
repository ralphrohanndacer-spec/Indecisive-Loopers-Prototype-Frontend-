import * as api from "./fetch.js";

document.addEventListener("DOMContentLoaded", () => {
  updateCartSummary();
  loadDefaultResults();
});

let cart = [];
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const budgetInput = document.getElementById("budget");
const sortPriceSelect = document.getElementById("sortPrice");
const categorySelect = document.getElementById("category");
const openOnlyRadio = document.getElementById("openOnly");
const availableOnlyRadio = document.getElementById("availableOnly");
const includeClosedRadio = document.getElementById("includeClosed");
const bestSellersCheckbox = document.getElementById("bestSellers");
const applyFiltersBtn = document.getElementById("applyFilters");
const chips = document.querySelectorAll(".quick .chip");
const mainSection = document.querySelector(".main");
const radioButtons = document.querySelectorAll('input[type="radio"]');

// Dialog elements
const imageDialog = document.getElementById("imageDialog");
const expandedFoodImage = document.getElementById("expandedFoodImage");

const stallMenuDialog = document.getElementById("stallMenuDialog");
const stallMenuItems = document.getElementById("stallMenuItems");

const menuStallName = document.getElementById("menuStallName");
const menuStallLocation = document.getElementById("menuStallLocation");

const mapDialog = document.getElementById("mapDialog");
const mapBtn = document.getElementById("mapBtn");
const closeMapBtn = document.getElementById("closeMapBtn");

const cartDialog = document.getElementById("cartDialog");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartBudgetStatus = document.getElementById("cartBudgetStatus");

// Store all menu items for stall menu viewing
let allMenuItemsCache = null;

// Image zoom level
let currentZoom = 1;

//Function to gather all active filter values
function getFilterValues() {
  const selectedLocations = Array.from(
    document.querySelectorAll('.quick .chip[aria-pressed="true"]'),
  ).map((chip) => chip.dataset.location);

  return {
    searchQuery: searchInput.value.trim().toLowerCase(),
    maxBudget: budgetInput.value ? parseFloat(budgetInput.value) : null,
    sortBy: sortPriceSelect.value,
    category: categorySelect.value,
    locations: selectedLocations,
    openOnly: openOnlyRadio.checked,
    availableOnly: availableOnlyRadio.checked,
    includeClosed: includeClosedRadio.checked,
    bestSellers: bestSellersCheckbox.checked,
  };
}

//Core filtering function
async function applyFilters() {
  const filters = getFilterValues();

  try {
    showLoadingState();
    let data = await api.getMenuItemAll();

    if (data && data.error) {
      displayErrorBanner(data.error);
      return;
    }

    let filteredResults = data || [];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase().trim();

      filteredResults = filteredResults.filter((item) => {
        return (
          item.name?.toLowerCase().includes(query) ||
          item.stall?.name?.toLowerCase().includes(query) ||
          item.stall?.location?.toLowerCase().includes(query) ||
          item.food_category?.toLowerCase().includes(query)
        );
      });
    }

    if (filters.locations.length > 0 && !filters.locations.includes("all")) {
      filteredResults = filteredResults.filter((item) => {
        return filters.locations.some((location) => {
          if (location === "Studentpreneurs") {
            return item.stall?.stall_type === "studentpreneur";
          }

          return item.stall?.location === location;
        });
      });
    }

    if (
      filters.category &&
      filters.category !== "all" &&
      filters.category !== "halal"
    ) {
      filteredResults = filteredResults.filter(
        (item) => item.food_category === filters.category,
      );
    }

    if (filters.category === "halal") {
      filteredResults = filteredResults.filter(
        (item) => item.is_halal === true,
      );
    }

    if (filters.maxBudget !== null) {
      filteredResults = filteredResults.filter(
        (item) => item.price <= filters.maxBudget,
      );
    }

    if (filters.openOnly) {
      filteredResults = filteredResults.filter(
        (item) => item.stall.is_open === true,
      );
    }

    if (filters.availableOnly) {
      filteredResults = filteredResults.filter(
        (item) => item.is_available === true,
      );
    }

    if (filters.bestSellers) {
      filteredResults = filteredResults.filter(
        (item) => item.is_best_seller === true,
      );
    }

    if (filters.sortBy === "price-asc") {
      filteredResults.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filters.sortBy === "price-desc") {
      filteredResults.sort((a, b) => Number(b.price) - Number(a.price));
    }

    renderResults(filteredResults);
  } catch (error) {
    console.error("Error applying filters:", error);
    displayErrorBanner("An unexpected error occurred while filtering.");
  }
}

function renderResults(items) {
  const stallListContainer = document.getElementById("stallList");
  const resultsCount = document.getElementById("resultsCount");
  const emptyState = document.getElementById("emptyState");

  stallListContainer.innerHTML = "";

  if (!items || items.length === 0) {
    if (resultsCount) resultsCount.textContent = "Showing 0 food items.";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  if (resultsCount) {
    resultsCount.textContent = `Showing ${items.length} food item${items.length === 1 ? "" : "s"}.`;
  }

  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "stall";

    const itemName = item.name || "Food Item";
    const stallName = item.stall?.name || "Food Stall";
    const category = item.food_category || "Filipino";
    const location = item.stall?.location || "Campus";
    const price = Number(item.price) || 0;
    const isBestSeller = item.is_best_seller ?? false;

    // Separate availability statuses
    const isOpen = item.stall?.is_open;
    const isAvailable = item.is_available;

    const imageUrl = item.image_url || "";

    article.dataset.name = `${stallName} ${itemName} ${category}`.toLowerCase();

    article.dataset.category = category;
    article.dataset.location = location;
    article.dataset.bestseller = String(isBestSeller);
    article.dataset.price = price;
    article.dataset.open = String(isOpen);
    article.dataset.available = String(isAvailable);

    // Stall availability
    const stallStatus = document.createElement("span");

    stallStatus.className =
      isOpen === true
        ? "status open"
        : isOpen === false
          ? "status closed"
          : "status unknown";

    stallStatus.textContent =
      isOpen === true ? "● Open" : isOpen === false ? "○ Closed" : "● Unknown";

    // Food item availability
    const itemStatus = document.createElement("span");

    itemStatus.className =
      isAvailable === true
        ? "item-status available"
        : isAvailable === false
          ? "item-status unavailable"
          : "item-status unknown";

    itemStatus.textContent =
      isAvailable === true
        ? "In Stock"
        : isAvailable === false
          ? "Out of Stock"
          : "Stock Unknown";

    // Food image button
    const imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = "food-image-button";
    imageButton.setAttribute("aria-label", `Enlarge ${itemName} image`);

    const foodImage = document.createElement("img");
    foodImage.className = "food-photo";
    foodImage.src = imageUrl;
    foodImage.alt = `${itemName} photo`;

    imageButton.appendChild(foodImage);

    // Stall information
    const info = document.createElement("div");
    info.className = "stall-info";

    const nameButton = document.createElement("button");
    nameButton.type = "button";
    nameButton.className = "stall-name-button";
    nameButton.textContent = stallName;
    nameButton.setAttribute("aria-label", `View ${stallName} menu`);

    const divider = document.createElement("hr");

    const foodDetails = document.createElement("p");
    foodDetails.className = "price";
    foodDetails.textContent = `${itemName} · ₱${price}`;

    const locationInfo = document.createElement("div");
    locationInfo.className = "wait";
    locationInfo.textContent = `🗺️ ${location}`;

    // Display both statuses
    const availabilityContainer = document.createElement("div");
    availabilityContainer.className = "availability-container";

    availabilityContainer.append(stallStatus, itemStatus);

    info.append(
      availabilityContainer,
      nameButton,
      divider,
      foodDetails,
      locationInfo,
    );

    article.append(imageButton, info);

    // Cart controls
    const cartControls = document.createElement("div");
    cartControls.className = "cart-controls";

    const cartItem = cart.find((cartItem) => cartItem.itemId === item.id);

    if (!cartItem) {
      const addButton = document.createElement("button");

      addButton.type = "button";
      addButton.className = "add-cart-btn";
      addButton.textContent = "+";
      addButton.setAttribute("aria-label", `Add ${itemName} to cart`);

      addButton.addEventListener("click", () => {
        addToCart(item);
        renderResults(items);
      });

      cartControls.appendChild(addButton);
    } else {
      const decreaseButton = document.createElement("button");

      decreaseButton.type = "button";
      decreaseButton.textContent = "−";
      decreaseButton.className = "quantity-btn";

      decreaseButton.addEventListener("click", () => {
        updateCartQuantity(item.id, -1);
        renderResults(items);
      });

      const quantityDisplay = document.createElement("span");
      quantityDisplay.textContent = cartItem.quantity;

      const increaseButton = document.createElement("button");

      increaseButton.type = "button";
      increaseButton.textContent = "+";
      increaseButton.className = "quantity-btn";

      increaseButton.addEventListener("click", () => {
        updateCartQuantity(item.id, 1);
        renderResults(items);
      });

      cartControls.append(decreaseButton, quantityDisplay, increaseButton);
    }

    article.appendChild(cartControls);

    // Open enlarged image
    imageButton.addEventListener("click", () => {
      openImageViewer(imageUrl, itemName);
    });

    // Open stall menu
    nameButton.addEventListener("click", () => {
      openStallMenu(item.stall, stallName);
    });

    stallListContainer.appendChild(article);
  });
}

async function openStallMenu(stall, stallName) {
  // Stall name
  menuStallName.textContent = stallName;

  // Stall opening status
  const stallStatus = document.createElement("span");

  stallStatus.className =
    stall?.is_open === true
      ? "status open"
      : stall?.is_open === false
        ? "status closed"
        : "status unknown";

  stallStatus.textContent =
    stall?.is_open === true
      ? "● Open"
      : stall?.is_open === false
        ? "○ Closed"
        : "● Unknown";

  menuStallName.appendChild(stallStatus);

  menuStallLocation.textContent = stall?.location || "Campus";

  document.querySelector(".stall-operating-hours")?.remove();

  if (stall?.operating_hours) {
    const operatingHours = document.createElement("p");

    operatingHours.className = "stall-operating-hours";
    operatingHours.textContent = `🕒 ${stall.operating_hours}`;

    menuStallLocation.after(operatingHours);
  }

  stallMenuItems.innerHTML = `
    <p class="menu-loading">Loading stall menu...</p>
  `;

  stallMenuDialog.showModal();

  try {
    // Fetch all menu items
    if (!allMenuItemsCache) {
      allMenuItemsCache = await api.getMenuItemAll();
    }

    if (!Array.isArray(allMenuItemsCache)) {
      throw new Error("Unable to retrieve stall menu.");
    }

    // Match menu items using stall ID when available
    const stallId = stall?.id;

    const menuItems = allMenuItemsCache.filter((item) => {
      if (stallId != null) {
        const itemStallId = item.stall?.id;

        return String(itemStallId) === String(stallId);
      }

      return item.stall?.name === stallName;
    });

    stallMenuItems.innerHTML = "";

    if (menuItems.length === 0) {
      stallMenuItems.textContent = "No menu items found for this stall.";
      return;
    }

    menuItems.forEach((item) => {
      const menuCard = document.createElement("div");
      menuCard.className = "stall-menu-card";

      // Food image
      const image = document.createElement("img");
      image.className = "stall-menu-image";
      image.src = item.image_url || "images/placeholder.png";
      image.alt = item.name || "Food Item";

      // Food details
      const details = document.createElement("div");
      details.className = "stall-menu-details";

      const name = document.createElement("h3");
      name.textContent = item.name || "Food Item";

      const category = document.createElement("p");
      category.textContent = item.food_category || "Uncategorized";

      const price = document.createElement("strong");
      price.textContent = `₱${Number(item.price) || 0}`;

      // Food availability
      const availability = document.createElement("span");

      // Closed stalls make all food items unavailable
      const isAvailable = stall?.is_open === false ? false : item.is_available;

      availability.className =
        isAvailable === true
          ? "item-status available"
          : isAvailable === false
            ? "item-status unavailable"
            : "item-status unknown";

      availability.textContent =
        isAvailable === true
          ? "✓ Available"
          : isAvailable === false
            ? "✕ Unavailable"
            : "? Unknown";

      details.append(name, category, price, availability);

      menuCard.append(image, details);

      stallMenuItems.appendChild(menuCard);
    });
  } catch (error) {
    console.error("Error loading stall menu:", error);

    stallMenuItems.textContent =
      "Unable to load this stall's menu. Please try again.";
  }
}

async function loadDefaultResults(filterSort) {
  try {
    showLoadingState();

    const data = await api.getMenuItemDefault();

    if (data && data.error) {
      displayErrorBanner(data.error);
      return;
    }

    if (filterSort === "price-asc") {
      data.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filterSort === "price-desc") {
      data.sort((a, b) => Number(b.price) - Number(a.price));
    }

    renderResults(data || []);
  } catch (error) {
    console.error("Error loading default results:", error);
    displayErrorBanner("Unable to load default menu items.");
  }
}

function showLoadingState(containerId = "stallList") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
        <div class="loading-spinner-wrapper" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="color: #666; margin-top: 1rem;">Finding delicious food for you...</p>
        </div>
    `;
}

function handleSearchAction() {
  if (mainSection) {
    mainSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function openImageViewer(imageUrl, itemName) {
  if (!imageUrl) return;

  currentZoom = 1;

  expandedFoodImage.src = imageUrl;
  expandedFoodImage.alt = `${itemName} enlarged image`;
  expandedFoodImage.style.transform = "scale(1)";

  imageDialog.showModal();
}

function updateImageZoom() {
  expandedFoodImage.style.transform = `scale(${currentZoom})`;
}

function addToCart(item) {
  const existingItem = cart.find((cartItem) => cartItem.itemId === item.id);

  if (existingItem) return;

  cart.push({
    itemId: item.id,
    name: item.name,
    price: Number(item.price) || 0,
    imageUrl: item.image_url || "",
    stallName: item.stall?.name || "Unknown Stall",
    stallLocation: item.stall?.location || "Campus",
    quantity: 1,
  });

  updateCartSummary();
}

function updateCartQuantity(itemId, change) {
  const cartItem = cart.find((item) => item.itemId === itemId);

  if (!cartItem) return;

  cartItem.quantity += change;

  if (cartItem.quantity <= 0) {
    cart = cart.filter((item) => item.itemId !== itemId);
  }

  updateCartSummary();
}

function updateCartSummary() {
  const cartSummary = document.getElementById("cartSummary");

  if (!cartSummary) return;

  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const budget = budgetInput.value ? Number(budgetInput.value) : null;

  let budgetMessage = "";

  if (budget !== null && Number.isFinite(budget)) {
    const remainingBudget = budget - totalPrice;

    if (remainingBudget < 0) {
      budgetMessage = `
        <p class="budget-warning">
          Over Budget by: ₱${Math.abs(remainingBudget).toFixed(2)}
        </p>
      `;
    } else {
      budgetMessage = `
        <p class="budget-remaining">
          Remaining Budget: ₱${remainingBudget.toFixed(2)}
        </p>
      `;
    }
  }

  cartSummary.innerHTML = `
  <p>Selected Items: ${totalQuantity}</p>
  <p>Total Cost: ₱${totalPrice.toFixed(2)}</p>
  ${budgetMessage}
  <button id="viewCartBtn" class="view-cart-btn" type="button">
    View Cart
  </button>
`;

  cartSummary.classList.toggle(
    "over-budget",
    budget !== null && Number.isFinite(budget) && totalPrice > budget,
  );
}

function clearCart() {
  if (cart.length === 0) return;

  const confirmClear = confirm("Are you sure you want to clear your cart?");

  if (!confirmClear) return;

  cart = [];

  updateCartSummary();
  renderCartItems();

  // Refresh the currently displayed food cards
  applyFilters();
}

function renderCartItems() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <p class="empty-cart">
        Your cart is empty. Add some food items to get started!
      </p>
    `;
  } else {
    cart.forEach((item) => {
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";

      const itemImage = document.createElement("img");
      itemImage.className = "cart-item-image";
      itemImage.src = item.imageUrl;
      itemImage.alt = item.name;

      const itemInfo = document.createElement("div");
      itemInfo.className = "cart-item-info";

      const itemName = document.createElement("h3");
      itemName.textContent = item.name;

      const stallName = document.createElement("p");
      stallName.className = "cart-stall-name";
      stallName.textContent = `${item.stallName}`;

      const stallLocation = document.createElement("p");
      stallLocation.className = "cart-stall-location";
      stallLocation.textContent = `Location: ${item.stallLocation}`;

      const itemPrice = document.createElement("p");
      itemPrice.textContent = `₱${item.price.toFixed(2)} each`;

      itemInfo.append(itemName, stallName, stallLocation, itemPrice);

      const controls = document.createElement("div");
      controls.className = "cart-item-controls";

      const decreaseBtn = document.createElement("button");
      decreaseBtn.type = "button";
      decreaseBtn.textContent = "−";
      decreaseBtn.addEventListener("click", () => {
        updateCartQuantity(item.itemId, -1);
        renderCartItems();
      });

      const quantity = document.createElement("span");
      quantity.textContent = item.quantity;

      const increaseBtn = document.createElement("button");
      increaseBtn.type = "button";
      increaseBtn.textContent = "+";
      increaseBtn.addEventListener("click", () => {
        updateCartQuantity(item.itemId, 1);
        renderCartItems();
      });

      controls.append(decreaseBtn, quantity, increaseBtn);

      const subtotal = document.createElement("p");
      subtotal.className = "cart-item-subtotal";
      subtotal.textContent = `₱${(item.price * item.quantity).toFixed(2)}`;

      cartItem.append(itemImage, itemInfo, controls, subtotal);
      cartItems.appendChild(cartItem);
    });
  }

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  cartTotal.textContent = `Total Cost: ₱${totalPrice.toFixed(2)}`;

  const budget = budgetInput.value ? Number(budgetInput.value) : null;

  if (budget !== null && Number.isFinite(budget)) {
    const remaining = budget - totalPrice;

    cartBudgetStatus.textContent =
      remaining < 0
        ? `Over Budget by: ₱${Math.abs(remaining).toFixed(2)}`
        : `Remaining Budget: ₱${remaining.toFixed(2)}`;

    cartBudgetStatus.className =
      remaining < 0 ? "budget-warning" : "budget-remaining";
  } else {
    cartBudgetStatus.textContent = "";
    cartBudgetStatus.className = "";
  }
}

document.getElementById("closeCartBtn").addEventListener("click", () => {
  cartDialog.close();
});

function displayErrorBanner(message) {
  const stallListContainer = document.getElementById("stallList");
  const resultsCount = document.getElementById("resultsCount");
  const emptyState = document.getElementById("emptyState");

  if (emptyState) emptyState.style.display = "none";

  if (resultsCount) {
    resultsCount.textContent = "Unable to load results.";
  }

  if (stallListContainer) {
    stallListContainer.innerHTML = `
      <div class="error-message-box" style="grid-column: 1 / -1; padding: 24px; text-align: center; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b;">
        <h3 style="margin-bottom: 8px; font-size: 1.1rem;">⚠️ Connection or Server Error</h3>
        <p style="margin: 0; font-size: 0.95rem;">${message}</p>
      </div>
    `;
  }
}

// --- Event Listeners ---

// Auto-trigger filters as user types or changes fields
[searchInput, budgetInput].forEach((element) => {
  element.addEventListener("input", applyFilters);
});

[
  sortPriceSelect,
  categorySelect,
  openOnlyRadio,
  availableOnlyRadio,
  includeClosedRadio,
  bestSellersCheckbox,
].forEach((element) => {
  element.addEventListener("change", applyFilters);
});

// Open campus map
mapBtn.addEventListener("click", () => {
  mapDialog.showModal();
});

// Close campus map
closeMapBtn.addEventListener("click", () => {
  mapDialog.close();
});

// Close when clicking outside the map
mapDialog.addEventListener("click", (event) => {
  if (event.target === mapDialog) {
    mapDialog.close();
  }
});

budgetInput.addEventListener("input", () => {
  updateCartSummary();

  if (cartDialog.open) {
    renderCartItems();
  }
});

const cartSummary = document.getElementById("cartSummary");
cartSummary.addEventListener("click", (event) => {
  if (event.target.closest("#viewCartBtn")) {
    renderCartItems();
    cartDialog.showModal();
  }
});

document.getElementById("clearCartBtn").addEventListener("click", clearCart);

// Multiple location selection
chips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    const location = chip.dataset.location;
    const isSelected = chip.getAttribute("aria-pressed") === "true";

    const allLocationsChip = document.querySelector(
      '.quick .chip[data-location="all"]',
    );

    if (location === "all") {
      // Select All Locations and deselect everything else
      chips.forEach((c) => {
        c.setAttribute(
          "aria-pressed",
          c.dataset.location === "all" ? "true" : "false",
        );
      });
    } else {
      // Deselect All Locations when choosing a specific location
      allLocationsChip.setAttribute("aria-pressed", "false");

      // Toggle the selected location
      chip.setAttribute("aria-pressed", isSelected ? "false" : "true");

      // If no specific locations are selected, activate All Locations
      const hasSelectedLocation = Array.from(chips).some(
        (c) =>
          c.dataset.location !== "all" &&
          c.getAttribute("aria-pressed") === "true",
      );

      if (!hasSelectedLocation) {
        allLocationsChip.setAttribute("aria-pressed", "true");
      }
    }

    await applyFilters();
  });
});
// For result info dialog
document.getElementById("closeMenuBtn").addEventListener("click", () => {
  stallMenuDialog.close();
});

stallMenuDialog.addEventListener("click", (event) => {
  if (event.target === stallMenuDialog) {
    stallMenuDialog.close();
  }
});

// For searchbtn and searchInput event listener
[searchBtn, searchInput, applyFiltersBtn].forEach((element) => {
  const eventType =
    element === searchBtn || element === applyFiltersBtn ? "click" : "keydown";

  element.addEventListener(eventType, (event) => {
    if (
      element === searchBtn ||
      event.key === "Enter" ||
      element === applyFiltersBtn
    ) {
      handleSearchAction();
    }
  });
});

radioButtons.forEach((radio) => {
  radio.addEventListener("click", async function () {
    if (this.dataset.wasChecked === "true") {
      this.checked = false;
      await loadDefaultResults();
    }

    radioButtons.forEach((r) => {
      r.dataset.wasChecked = r.checked ? "true" : "false";
    });
  });
});

document.getElementById("zoomInBtn").addEventListener("click", () => {
  currentZoom = Math.min(currentZoom + 0.25, 3);
  updateImageZoom();
});

document.getElementById("zoomOutBtn").addEventListener("click", () => {
  currentZoom = Math.max(currentZoom - 0.25, 1);
  updateImageZoom();
});

document.getElementById("resetZoomBtn").addEventListener("click", () => {
  currentZoom = 1;
  updateImageZoom();
});

document.getElementById("closeImageBtn").addEventListener("click", () => {
  imageDialog.close();
});

imageDialog.addEventListener("click", (event) => {
  if (event.target === imageDialog) {
    imageDialog.close();
  }
});
