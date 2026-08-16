const page = document.body.dataset.page;
const API = "";

// =====================
// HELPERS
// =====================
const getToken = () => localStorage.getItem("token");
const getUsername = () => localStorage.getItem("username");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const showError = (id, msg) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
};

const hideError = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
};

const showSuccess = (id, msg) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
};

const rarityClass = (rarity) => rarity.replace(/\s/g, "");

// =====================
// CUSTOM POPUPS
// =====================
let confirmCallback = null;
let quantityCallback = null;
let quantityMax = 1;
let quantityCurrent = 1;

const showAlert = (message) => {
  document.getElementById("alertMsg").textContent = message;
  document.getElementById("alertOverlay").classList.add("active");
};

window.closeAlert = () => {
  document.getElementById("alertOverlay").classList.remove("active");
};

const showConfirm = (message, onConfirm) => {
  document.getElementById("confirmMsg").textContent = message;
  document.getElementById("confirmOverlay").classList.add("active");
  confirmCallback = onConfirm;
};

window.closeConfirm = (confirmed) => {
  document.getElementById("confirmOverlay").classList.remove("active");
  if (confirmCallback) {
    confirmCallback(confirmed);
    confirmCallback = null;
  }
};

const showQuantitySelector = (message, max, onSubmit) => {
  quantityMax = max;
  quantityCurrent = 1;
  quantityCallback = onSubmit;
  document.getElementById("quantityMsg").textContent = message;
  document.getElementById("quantityValue").textContent = 1;
  document.getElementById("quantityMax").textContent = `Max: ${max}`;
  document.getElementById("quantityOverlay").classList.add("active");
};

window.closeQuantity = (submitted) => {
  document.getElementById("quantityOverlay").classList.remove("active");
  if (quantityCallback) {
    quantityCallback(submitted ? quantityCurrent : null);
    quantityCallback = null;
  }
};

window.changeQuantity = (delta) => {
  quantityCurrent = Math.min(quantityMax, Math.max(1, quantityCurrent + delta));
  document.getElementById("quantityValue").textContent = quantityCurrent;
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (document.getElementById("alertOverlay").classList.contains("active")) closeAlert();
    else if (document.getElementById("confirmOverlay").classList.contains("active")) closeConfirm(true);
    else if (document.getElementById("quantityOverlay").classList.contains("active")) closeQuantity(true);
  }
  if (e.key === "Escape") {
    if (document.getElementById("alertOverlay").classList.contains("active")) closeAlert();
    else if (document.getElementById("confirmOverlay").classList.contains("active")) closeConfirm(false);
    else if (document.getElementById("quantityOverlay").classList.contains("active")) closeQuantity(false);
  }
});

// =====================
// LOGIN PAGE
// =====================
if (page === "login") {
  if (getToken()) window.location.href = "./index.html";

  window.login = async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    hideError("errorMsg");

    if (!username || !password) {
      showError("errorMsg", "Please enter both username and password.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("errorMsg", data.error || "Login failed.");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      window.location.href = "./index.html";
    } catch {
      showError("errorMsg", "Something went wrong. Please try again.");
    }
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") window.login();
  });
}

// =====================
// REGISTER PAGE
// =====================
if (page === "register") {
  if (getToken()) window.location.href = "./index.html";

  window.register = async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    hideError("errorMsg");
    hideError("successMsg");

    if (!username || !password || !confirmPassword) {
      showError("errorMsg", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      showError("errorMsg", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      showError("errorMsg", "Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("errorMsg", data.error || "Registration failed.");
        return;
      }
      showSuccess("successMsg", "Account created! Redirecting to login...");
      setTimeout(() => (window.location.href = "./login.html"), 2000);
    } catch {
      showError("errorMsg", "Something went wrong. Please try again.");
    }
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") window.register();
  });
}

// =====================
// GAME PAGE
// =====================
if (page === "game") {
  if (!getToken()) window.location.href = "./login.html";

  let drawnCard = null;
  let welcomePacksBought = 0;

  // --- Init ---
  const init = async () => {
    document.getElementById("headerUsername").textContent = getUsername();
    await refreshCoins();
    await loadCollection();
    await loadPacks();
    await loadMyPacks();
    await loadAchievements();
  };

  const refreshCoins = async () => {
    try {
      const res = await fetch(`${API}/api/users/${getUsername()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok)
        document.getElementById("headerCoins").textContent =
          data.coins.toLocaleString();
      if (res.ok) welcomePacksBought = data.welcome_packs_bought;
    } catch {
      console.error("Failed to refresh coins");
    }
  };

  // --- Tabs ---
  window.switchTab = (tab, btn) => {
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.getElementById(`tab-${tab}`).classList.add("active");
    if (btn) btn.classList.add("active");

    if (tab === "achievements") {
      window.checkAchievements();
    }
  };

  // Lets dashboard tiles (which aren't nav-btn elements) drive the same
  // switchTab logic and keep the side-nav active state in sync.
  window.goToTab = (tab) => {
    const btn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
    window.switchTab(tab, btn);
  };

  // --- Logout ---
  window.logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "./login.html";
  };

  // --- Collection ---
  window.loadCollection = async () => {
    const rarity = document.getElementById("filterRarity").value;
    const position = document.getElementById("filterPosition").value;
    const sort = document.getElementById("sortOrder").value;

    let url = `${API}/api/users/${getUsername()}/collection`;
    const params = new URLSearchParams();
    if (rarity) params.append("rarity", rarity);
    if (position) params.append("position", position);
    if (sort) params.append("sort", sort);
    if ([...params].length) url += `?${params.toString()}`;

    try {
      const res = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      const grid = document.getElementById("collectionGrid");

      const dashCount = document.getElementById("dashCollectionCount");
      if (dashCount && res.ok) {
        const totalCards = data.reduce((sum, c) => sum + c.quantity, 0);
        dashCount.textContent = `${totalCards.toLocaleString()} card${totalCards === 1 ? "" : "s"}`;
      }

      if (!res.ok || data.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No cards found.</p>';
        await loadUltimateCollection();
        return;
      }

      grid.innerHTML = data.map((card) => `
        <div class="collection-card rarity-${rarityClass(card.rarity)}">
          <img class="collection-player-card" src="./img/${card.card_id}.png" alt="${card.player_name} player card">
          <div class="card-quantity">x${card.quantity}</div>
          <div class="card-rarity-badge rarity-${rarityClass(card.rarity)}">${card.rarity}</div>
          <div class="card-overall">${card.overall_rating}</div>
          <div class="card-name">${card.player_name}</div>
          <div class="card-details">${card.team} · ${card.position}</div>
          <button class="sell-btn"
            data-card-id="${card.card_id}"
            data-player-name="${card.player_name.replace(/"/g, "&quot;")}"
            data-quantity="${card.quantity}"
            data-sell-value="${card.sell_value}">
            Sell (${card.sell_value.toLocaleString()} coins)
          </button>
        </div>
      `).join("");

      document.querySelectorAll(".sell-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          sellCard(
            btn.dataset.cardId,
            btn.dataset.playerName,
            parseInt(btn.dataset.quantity),
            parseInt(btn.dataset.sellValue)
          );
        });
      });

      await loadUltimateCollection();
    } catch {
      console.error("Failed to load collection");
    }
  };

  window.loadUltimateCollection = async () => {
    try {
      const res = await fetch(`${API}/api/users/${getUsername()}/ultimate-collection`, {
        headers: authHeaders(),
      });
      const cards = await res.json();
      if (!res.ok) return;

      const discoveredCount = cards.filter((card) => card.discovered).length;
      document.getElementById("ultimateProgress").textContent =
        `${discoveredCount} / ${cards.length} collected`;

      document.getElementById("ultimateCollectionGrid").innerHTML = cards.map((card) => `
        <div class="ultimate-card ${card.discovered ? "discovered rarity-" + rarityClass(card.rarity) : "undiscovered"}">
          ${card.discovered
          ? `<img src="./img/${card.card_id}.png" alt="${card.player_name} player card">`
          : '<span class="undiscovered-card-mark">?</span>'}
        </div>
      `).join("");
    } catch {
      console.error("Failed to load ultimate collection");
    }
  };

  window.sellCard = async (cardId, playerName, maxQuantity, sellValue) => {
    maxQuantity = parseInt(maxQuantity);
    sellValue = parseInt(sellValue);

    if (isNaN(maxQuantity) || isNaN(sellValue)) {
      showAlert("Something went wrong reading card data.");
      return;
    }

    if (maxQuantity === 1) {
      showConfirm(
        `Sell 1x ${playerName} for ${sellValue.toLocaleString()} coins?`,
        async (confirmed) => {
          if (!confirmed) return;
          await doSellCard(cardId, 1);
        }
      );
    } else {
      showQuantitySelector(
        `How many ${playerName} do you want to sell?\n${sellValue.toLocaleString()} coins each.`,
        maxQuantity,
        (quantity) => {
          if (quantity === null) return;
          showConfirm(
            `Sell ${quantity}x ${playerName} for ${(sellValue * quantity).toLocaleString()} coins?`,
            async (confirmed) => {
              if (!confirmed) return;
              await doSellCard(cardId, quantity);
            }
          );
        }
      );
    }
  };

  const doSellCard = async (cardId, quantity) => {
    try {
      const res = await fetch(
        `${API}/api/users/${getUsername()}/collection/sell/${cardId}?quantity=${quantity}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showAlert(data.error || "Failed to sell card.");
        return;
      }
      showAlert(data.message);
      await loadCollection();
      await refreshCoins();
    } catch {
      showAlert("Something went wrong.");
    }
  };

  window.sellAll = async () => {
    showConfirm(
      "Sell ALL cards in your collection? This cannot be undone.",
      async (confirmed) => {
        if (!confirmed) return;
        try {
          const res = await fetch(
            `${API}/api/users/${getUsername()}/collection/sell-all`,
            {
              method: "DELETE",
              headers: authHeaders(),
            }
          );
          const data = await res.json();
          if (!res.ok) {
            showAlert(data.error || "Failed to sell all cards.");
            return;
          }
          showAlert(data.message);
          await loadCollection();
          await refreshCoins();
        } catch {
          showAlert("Something went wrong.");
        }
      }
    );
  };

  // --- Packs ---
  const packEmojis = {
    "starter-pack": "🥉",
    "pro-pack": "🥈",
    "elite-pack": "🥇",
    "legend-pack": "💎",
  };

  let availablePackOdds = {};

  window.showPackOdds = (packId, packName) => {
    const odds = availablePackOdds[packId];
    if (!odds) return;
    const oddsSummary = Object.entries(odds)
      .map(([rarity, chance]) => `${rarity}: ${chance}%`)
      .join(" • ");
    showAlert(`${packName} odds: ${oddsSummary}`);
  };

  let drawnCards = [];
  let currentBatchStart = 0;
  let currentBatchFlipped = 0;
  const BATCH_SIZE = 5;

  const showMultiCardOverlay = (cards, packName, packId, remainingCoins) => {
    drawnCards = cards;
    currentBatchStart = 0;
    currentBatchFlipped = 0;

    document.getElementById("overlayTitle").textContent = `Opening ${packName}`;
    document.getElementById("batchProgress").style.display = "block";
    document.getElementById("cardsBatchWrapper").style.display = "block";
    document.getElementById("revealCoinsMsg").textContent = remainingCoins !== null
      ? `Remaining coins: ${remainingCoins.toLocaleString()}` : "";
    document.getElementById("overlayFlipAllBtn").style.display = "none";
    document.getElementById("overlayNextBatchBtn").style.display = "none";
    document.getElementById("overlayCloseBtn").style.display = "none";
    document.getElementById("packOverlay").classList.add("active");

    renderBatch(0, false);
  };

  const renderBatch = (startIndex, slideIn) => {
    currentBatchStart = startIndex;
    currentBatchFlipped = 0;

    const batch = drawnCards.slice(startIndex, startIndex + BATCH_SIZE);
    const totalBatches = Math.ceil(drawnCards.length / BATCH_SIZE);
    const currentBatch = Math.floor(startIndex / BATCH_SIZE) + 1;

    document.getElementById("batchProgress").textContent =
      drawnCards.length > BATCH_SIZE
        ? `Batch ${currentBatch} of ${totalBatches} — Card ${startIndex + 1}-${Math.min(startIndex + BATCH_SIZE, drawnCards.length)} of ${drawnCards.length}`
        : `${drawnCards.length} card${drawnCards.length > 1 ? "s" : ""}`;

    document.getElementById("overlayFlipAllBtn").style.display = "inline-block";
    document.getElementById("overlayNextBatchBtn").style.display = "none";
    document.getElementById("overlayCloseBtn").style.display = "none";

    const batchEl = document.getElementById("cardsBatch");
    batchEl.innerHTML = batch.map((card, i) => `
    <div class="flip-card rarity-${rarityClass(card.rarity)}"
     id="flip-${startIndex + i}"
     onclick="flipCardAt(${startIndex + i})">

      <div class="flip-card-inner" id="flip-inner-${startIndex + i}">

        <!-- Unflipped: normal card back -->
        <div class="flip-card-front">🏀</div>

        <!-- Flipped: player card image -->
        <div class="flip-card-back rarity-${rarityClass(card.rarity)}">
          <img
            class="full-player-card"
            src="./img/${card.card_id}.png"
            alt="${card.player_name}"
          >
        </div>

      </div>
    </div>
    `).join("");

    if (slideIn) {
      batchEl.classList.add("slide-in-left");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          batchEl.classList.remove("slide-in-left");
          batchEl.classList.add("slide-in-active");
          setTimeout(() => batchEl.classList.remove("slide-in-active"), 500);
        });
      });
    }
  };

  window.flipCardAt = (index) => {
    const inner = document.getElementById(`flip-inner-${index}`);
    if (!inner || inner.classList.contains("flipped")) return;
    inner.classList.add("flipped");
    inner.closest(".flip-card").classList.add("revealed");
    currentBatchFlipped++;

    const batchSize = Math.min(BATCH_SIZE, drawnCards.length - currentBatchStart);
    if (currentBatchFlipped >= batchSize) {
      onBatchComplete();
    }
  };

  window.flipAllCards = () => {
    const batch = drawnCards.slice(currentBatchStart, currentBatchStart + BATCH_SIZE);
    batch.forEach((_, i) => {
      const inner = document.getElementById(`flip-inner-${currentBatchStart + i}`);
      if (!inner || inner.classList.contains("flipped")) return;
      setTimeout(() => {
        inner.classList.add("flipped");
        inner.closest(".flip-card").classList.add("revealed");
        currentBatchFlipped++;
        const batchSize = Math.min(BATCH_SIZE, drawnCards.length - currentBatchStart);
        if (currentBatchFlipped >= batchSize) onBatchComplete();
      }, i * 150);
    });
  };

  const onBatchComplete = () => {
    document.getElementById("overlayFlipAllBtn").style.display = "none";
    const isLastBatch = currentBatchStart + BATCH_SIZE >= drawnCards.length;
    if (isLastBatch) {
      document.getElementById("overlayNextBatchBtn").style.display = "none";
      document.getElementById("overlayCloseBtn").style.display = "inline-block";
      loadCollection();
    } else {
      document.getElementById("overlayNextBatchBtn").style.display = "inline-block";
    }
  };

  window.nextBatch = () => {
    const batchEl = document.getElementById("cardsBatch");
    batchEl.classList.add("slide-out-right");
    setTimeout(() => {
      batchEl.classList.remove("slide-out-right");
      renderBatch(currentBatchStart + BATCH_SIZE, true);
    }, 400);
  };

  window.closeOverlay = () => {
    document.getElementById("packOverlay").classList.remove("active");
    document.getElementById("cardsBatch").innerHTML = "";
    document.getElementById("batchProgress").style.display = "none";
    document.getElementById("cardsBatchWrapper").style.display = "none";
    drawnCards = [];
    currentBatchStart = 0;
    currentBatchFlipped = 0;
  };

  const loadPacks = async () => {
    try {
      const res = await fetch(`${API}/api/packs`, { headers: authHeaders() });
      const packs = await res.json();
      availablePackOdds = Object.fromEntries(packs.map((pack) => [pack.pack_id, pack.odds]));
      document.getElementById("packGrid").innerHTML = packs.map((pack, index) => `
        <article class="pack-card pack-card-${index % 4}" data-pack-id="${pack.pack_id}">
          <div class="pack-art" aria-hidden="true">
            <span class="pack-art-flare"></span>
            <span class="pack-icon">${packEmojis[pack.pack_id] || "📦"}</span>
            <span class="pack-art-series">HOOPVAULT</span>
            <strong>${pack.pack_name}</strong>
          </div>
          <div class="pack-info">
            <div class="pack-name">${pack.pack_name}</div>
            <div class="pack-min-rarity">${pack.pack_id === "welcome-pack" ? `${Math.max(0, 3 - welcomePacksBought)} of 3 Welcome Packs remaining` : `Guaranteed ${pack.min_rarity} or better`}</div>
            <div class="pack-quantity-label">
              <span>Quantity</span>
              <div class="pack-stepper" aria-label="Pack quantity for ${pack.pack_name}">
                <button type="button" class="pack-stepper-btn" aria-label="Remove one pack" onclick="changePackQuantity(this, -1)">−</button>
                <span class="pack-quantity" aria-live="polite">1</span>
                <button type="button" class="pack-stepper-btn" aria-label="Add one pack" onclick="changePackQuantity(this, 1)">+</button>
              </div>
            </div>
            <div class="pack-cost" data-unit-cost="${pack.cost}">💰 <span class="pack-total-cost">${pack.cost.toLocaleString()}</span> <span class="pack-cost-note">for 1 pack</span></div>
            <button class="pack-odds-btn" onclick="showPackOdds('${pack.pack_id}', '${pack.pack_name.replace(/'/g, "\\'")}')">Odds</button>
            <button class="open-pack-btn" onclick="openPack('${pack.pack_id}', '${pack.pack_name.replace(/'/g, "\\'")}', ${pack.cost}, Number(this.closest('.pack-card').querySelector('.pack-quantity').textContent))">
              Open Pack
            </button>
          </div>
        </article>
      `).join("");

      const welcomePackCard = document.querySelector('[data-pack-id="welcome-pack"]');
      if (welcomePackCard) {
        const remainingWelcomePacks = Math.max(0, 3 - welcomePacksBought);
        const stepperButtons = welcomePackCard.querySelectorAll(".pack-stepper-btn");
        stepperButtons.forEach((button) => {
          button.disabled = remainingWelcomePacks === 0;
        });
        if (stepperButtons[0]) stepperButtons[0].onclick = () => changePackQuantity(stepperButtons[0], -1, remainingWelcomePacks);
        if (stepperButtons[1]) stepperButtons[1].onclick = () => changePackQuantity(stepperButtons[1], 1, remainingWelcomePacks);

        const openButton = welcomePackCard.querySelector(".open-pack-btn");
        if (remainingWelcomePacks === 0 && openButton) {
          openButton.disabled = true;
          openButton.textContent = "Unavailable";
        }
      }

      if (packs.length > 0) {
        const featured = packs.reduce((max, p) => (p.cost > max.cost ? p : max), packs[0]);
        const promoName = document.getElementById("dashPromoName");
        const promoCost = document.getElementById("dashPromoCost");
        if (promoName) promoName.textContent = featured.pack_name;
        if (promoCost) promoCost.textContent = `💰 ${featured.cost.toLocaleString()} coins`;
      }
    } catch {
      console.error("Failed to load packs");
    }
  };

  window.changePackQuantity = (button, delta, maximumQuantity = 20) => {
    const packCard = button.closest(".pack-card");
    const quantityEl = packCard.querySelector(".pack-quantity");
    const costEl = packCard.querySelector(".pack-cost");
    const totalEl = packCard.querySelector(".pack-total-cost");
    const noteEl = packCard.querySelector(".pack-cost-note");
    const nextQuantity = Math.min(maximumQuantity, Math.max(1, Number(quantityEl.textContent) + delta));
    const unitCost = Number(costEl.dataset.unitCost);

    quantityEl.textContent = nextQuantity;
    totalEl.textContent = (unitCost * nextQuantity).toLocaleString();
    noteEl.textContent = `for ${nextQuantity} pack${nextQuantity === 1 ? "" : "s"}`;
  };

  window.loadMyPacks = async () => {
    try {
      const res = await fetch(`${API}/api/users/${getUsername()}/packs`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      const grid = document.getElementById("myPackGrid");

      const dashMyPacks = document.getElementById("dashMyPacksCount");

      if (!res.ok || data.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No reward packs at the moment.</p>';
        if (dashMyPacks) dashMyPacks.textContent = "0 available";
        return;
      }

      const totalPacks = data.reduce((sum, p) => sum + p.quantity, 0);
      if (dashMyPacks) dashMyPacks.textContent = `${totalPacks.toLocaleString()} available`;

      grid.innerHTML = `
        <div style="grid-column: 1/-1; display: flex; justify-content: flex-end; margin-bottom: 8px;">
          <button class="open-pack-btn" style="width:auto; padding: 10px 24px;" onclick="openAllFreePacks()">Open All (${totalPacks} packs)</button>
        </div>
        ${data.map((up) => `
          <div class="pack-card">
            <span class="pack-icon">${packEmojis[up.pack_id] || "📦"}</span>
            <div class="pack-name">${up.pack_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
            <div class="pack-cost" style="color: #4ade80">🎁 Free</div>
            <div class="pack-min-rarity">Quantity: ${up.quantity}</div>
            <button class="open-pack-btn" onclick="openFreePack('${up.pack_id}', ${up.quantity})">
              Open Pack
            </button>
          </div>
        `).join("")}
      `;
    } catch {
      console.error("Failed to load my packs");
    }
  };

  window.openPack = async (packId, packName, cost, selectedQuantity) => {
    const openQuantity = (quantity) => {
      if (!quantity) return;
      const totalCost = cost * quantity;
      showConfirm(
        `Open ${quantity}x ${packName} for ${totalCost.toLocaleString()} coins?`,
        async (confirmed) => {
          if (!confirmed) return;
          try {
            const res = await fetch(`${API}/api/packs/open/${packId}/bulk`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ username: getUsername(), quantity }),
            });
            const data = await res.json();
            if (!res.ok) { showAlert(data.error || "Failed to open packs."); return; }
            await refreshCoins();
            await loadPacks();
            await checkAchievements();
            showMultiCardOverlay(data.cards, packName, packId, data.remaining_coins);
          } catch {
            showAlert("Something went wrong.");
          }
        }
      );
    };

    if (selectedQuantity) {
      openQuantity(selectedQuantity);
      return;
    }

    showQuantitySelector(
      `How many ${packName} do you want to open?\n${cost.toLocaleString()} coins each.`,
      50,
      (quantity) => {
        if (quantity === null) return;
        openQuantity(quantity);
      }
    );
  };

  window.openFreePack = async (packId, quantity) => {
    const packName = packId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    showQuantitySelector(
      `How many ${packName} do you want to open?\nYou have ${quantity} available.`,
      quantity,
      (amount) => {
        if (amount === null) return;
        showConfirm(
          `Open ${amount}x ${packName} for free?`,
          async (confirmed) => {
            if (!confirmed) return;
            try {
              const results = [];
              for (let i = 0; i < amount; i++) {
                const res = await fetch(`${API}/api/users/${getUsername()}/packs/${packId}/open`, {
                  method: "POST",
                  headers: authHeaders(),
                });
                const data = await res.json();
                if (!res.ok) { showAlert(data.error || "Failed to open pack."); return; }
                results.push(data.card);
              }
              await refreshCoins();
              await checkAchievements();
              await window.loadMyPacks();
              showMultiCardOverlay(results, packName, packId, null);
            } catch {
              showAlert("Something went wrong.");
            }
          }
        );
      }
    );
  };

  window.openAllFreePacks = async () => {
    showConfirm("Open ALL your free packs at once?", async (confirmed) => {
      if (!confirmed) return;
      try {
        const res = await fetch(`${API}/api/users/${getUsername()}/packs/open-all`, {
          method: "POST",
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) { showAlert(data.error || "Failed to open all packs."); return; }
        await refreshCoins();
        await checkAchievements();
        await window.loadMyPacks();
        showMultiCardOverlay(data.cards, "All Free Packs", "starter-pack", null);
      } catch {
        showAlert("Something went wrong.");
      }
    });
  };

  // --- Achievements ---
  const achievementRarities = ["Gold", "Emerald", "Sapphire", "Ruby", "Amethyst", "Diamond", "Pink Diamond", "Galaxy Opal", "Dark Matter"];

  const getAchievementProgress = (achievement, stats) => {
    if (achievement.condition_type === "packs_opened") {
      return { current: stats.packsOpened, target: Number(achievement.condition_value), label: "packs opened" };
    }
    if (achievement.condition_type === "coins_spent") {
      return { current: stats.coinsSpent, target: Number(achievement.condition_value), label: "coins spent" };
    }
    if (achievement.condition_type === "collection_size") {
      return { current: stats.collectionSize, target: Number(achievement.condition_value), label: "unique cards owned" };
    }
    if (achievement.condition_type === "rarity_pulled") {
      return {
        current: stats.highestRarityIndex >= achievementRarities.indexOf(achievement.condition_value) ? 1 : 0,
        target: 1,
        label: "collected",
      };
    }
    return { current: stats.discoveredCount, target: stats.totalCards, label: "cards discovered" };
  };

  let achievementToastTimer;
  const showAchievementToast = (achievements) => {
    const toast = document.getElementById("achievementToast");
    toast.innerHTML = `<strong>🏆 Achievement unlocked!</strong><span>${achievements.map((achievement) => achievement.name).join(", ")}</span>`;
    toast.classList.add("visible");
    clearTimeout(achievementToastTimer);
    achievementToastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
  };

  const loadAchievements = async () => {
    try {
      const res = await fetch(`${API}/api/users/${getUsername()}/achievements/progress`, {
        headers: authHeaders(),
      });
      const { achievements: allAchievements, userAchievements, stats } = await res.json();
      if (!res.ok) return;

      const unlockedMap = {};
      userAchievements.forEach((ua) => {
        unlockedMap[ua.user_achievements.achievement_id] = ua.user_achievements;
      });

      let claimableCount = 0;

      document.getElementById("achievementList").innerHTML = allAchievements.map((a) => {
        const ua = unlockedMap[a.achievement_id];
        const isUnlocked = !!ua;
        const isClaimed = ua?.claimed;
        const progress = getAchievementProgress(a, stats);
        const percentage = Math.min(100, Math.round((progress.current / progress.target) * 100));
        if (isUnlocked && !isClaimed) claimableCount++;

        let statusHtml = '<span class="achievement-status">🔒 Locked</span>';
        let btnHtml = "";

        if (isUnlocked && !isClaimed) {
          statusHtml = '<span class="achievement-status" style="color:#FFD700">🏆 Unlocked!</span>';
          btnHtml = `<button class="claim-btn" onclick="claimAchievement('${a.achievement_id}')">Claim</button>`;
        } else if (isClaimed) {
          statusHtml = '<span class="achievement-status" style="color:#27ae60">✅ Claimed</span>';
        }

        return `
          <div class="achievement-item ${isUnlocked && !isClaimed ? "unlocked" : ""} ${isClaimed ? "claimed" : ""}">
            <div class="achievement-info">
              <div class="achievement-name">${a.name}</div>
              <div class="achievement-desc">${a.description}</div>
              <div class="achievement-progress-row">
                <div class="achievement-progress-bar"><span style="width:${percentage}%"></span></div>
                <span>${Math.min(progress.current, progress.target).toLocaleString()} / ${progress.target.toLocaleString()} ${progress.label}</span>
              </div>
              <div class="achievement-reward">🎁 Reward: ${a.reward_pack_quantity}x ${a.reward_pack_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
            </div>
            ${statusHtml}
            ${btnHtml}
          </div>
        `;
      }).join("");

      const dashAchievements = document.getElementById("dashAchievementsCount");
      if (dashAchievements) dashAchievements.textContent = `${claimableCount} to claim`;
      document.getElementById("achievementDot").hidden = claimableCount === 0;
    } catch {
      console.error("Failed to load achievements");
    }
  };

  window.claimAchievement = async (achievementId) => {
    try {
      const res = await fetch(
        `${API}/api/users/${getUsername()}/achievements/${achievementId}/claim`,
        { method: "POST", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) {
        showAlert(data.error || "Failed to claim achievement.");
        return;
      }
      showAlert(data.message);
      await loadAchievements();
      await window.loadMyPacks();
    } catch {
      showAlert("Something went wrong.");
    }
  };

  window.checkAchievements = async () => {
    try {
      const res = await fetch(`${API}/api/users/${getUsername()}/achievements/check`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.newlyUnlocked?.length > 0) {
        showAchievementToast(data.newlyUnlocked);
        await loadAchievements();
      }
    } catch {
      console.error("Failed to check achievements");
    }
  };

  // Start the game
  init();
}
