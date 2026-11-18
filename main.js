import * as api from "./fetch.js";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const budgetInput = document.getElementById("budget");
const sortPriceSelect = document.getElementById("sortPrice");
const categorySelect = document.getElementById("category");
const openOnlyCheckbox = document.getElementById("openOnly");
const includeClosedCheckbox = document.getElementById("includeClosed");
const bestSellersCheckbox = document.getElementById("bestSellers");
const applyFiltersBtn = document.getElementById("applyFilters");
const chips = document.querySelectorAll(".quick .chip");
const mainSection = document.querySelector(".main");
const radioButtons = document.querySelectorAll('input[type="radio"]');

document.addEventListener("DOMContentLoaded", () => {
  loadDefaultResults();
});

//Function to gather all active filter values
function getFilterValues() {
  const activeChip = document.querySelector(".quick .chip.active");

  return {
    searchQuery: searchInput.value.trim().toLowerCase(),
    maxBudget: budgetInput.value ? parseFloat(budgetInput.value) : null,
    sortBy: sortPriceSelect.value,
    category: categorySelect.value,
    location: activeChip ? activeChip.getAttribute("data-location") : null,
    openOnly: openOnlyCheckbox.checked,
    includeClosed: includeClosedCheckbox.checked,
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

    if (filters.location && filters.location !== "all") {
      filteredResults = filteredResults.filter(
        (item) => item.stall.location === filters.location,
      );
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

    if (filteredResults.length === data.length && !filters.includeClosed) {
      await loadDefaultResults(filters.sortBy);
      return;
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
    if (resultsCount) resultsCount.textContent = "Showing 0 food stalls.";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  if (resultsCount) {
    resultsCount.textContent = `Showing ${items.length} food stall${items.length === 1 ? "" : "s"}.`;
  }

  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "stall";

    const itemName = item.name || "Food Item";
    const stallName = item.stall.name || "Food Stall";
    const category = item.food_category || "Filipino";
    const location = item.stall.location || "Campus";
    const price = item.price || 0;
    const isBestSeller = item.is_best_seller ?? true;
    const isOpen = item.stall.is_open ?? true;
    const imageUrl = item.image_url || "";

    article.setAttribute(
      "data-name",
      `${stallName} ${itemName} ${category}`.toLowerCase(),
    );
    article.setAttribute("data-category", category);
    article.setAttribute("data-location", location);
    article.setAttribute("data-bestseller", isBestSeller ? "true" : "false");
    article.setAttribute("data-price", price);
    article.setAttribute("data-open", isOpen ? "true" : "false");

    const statusClass = isOpen ? "status open" : "status closed";
    const statusText = isOpen ? "● Open" : "○ Closed";

    article.innerHTML = `
      <img
        class="food-photo"
        src="${imageUrl}"
        alt="${itemName} photo"
      />
      <div class="stall-info">
        <span class="${statusClass}">${statusText}</span>
        <h3>${stallName}</h3>
        <hr>
        <p class="price">${itemName} · ₱${price}</p>
        <div class="wait">Location: ${location}</div>
      </div>
    `;

    stallListContainer.appendChild(article);
  });
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
  openOnlyCheckbox,
  includeClosedCheckbox,
  bestSellersCheckbox,
].forEach((element) => {
  element.addEventListener("change", applyFilters);
});

// Location chips auto-filtering
chips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    const isActive = chip.classList.contains("active");

    chips.forEach((c) => {
      c.classList.remove("active");
      c.setAttribute("aria-pressed", "false");
    });

    if (!isActive) {
      chip.classList.add("active");
      chip.setAttribute("aria-pressed", "true");
    }

    await applyFilters();
  });
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
