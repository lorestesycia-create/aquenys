import {
  AdMob,
  BannerAdSize,
  BannerAdPosition
} from "@capacitor-community/admob";

const STORAGE_KEY = "aquenys_state_v1";

const CONFIG = {
  decayPerHour: {
    oxygen: 2.0,
    food: 2.5,
    clean: 1.5
  },
  maintenance: {
    oxygen: { duration: 90, gain: 20 },
    food: { duration: 60, gain: 25 },
    clean: { duration: 120, gain: 20 }
  },
  protectionDuration: 2 * 60 * 60 * 1000,
  protectionCooldown: 6 * 60 * 60 * 1000,
  protectionDecayMultiplier: 0.25,
  protectionMaintenanceMultiplier: 2
};

const now = Date.now();

let state = {
  oxygen: 100,
  food: 100,
  clean: 100,
  createdAt: now,
  lastUpdate: now,
  protectionUntil: 0,
  nextProtectionAt: 0,
  rewardAdsWatched: 0,
  recordMs: 0
};

const activeTasks = {
  oxygen: null,
  food: null,
  clean: null
};

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && typeof saved === "object") {
      state = { ...state, ...saved };
    }
  } catch (error) {
    console.warn("No se pudo cargar el estado guardado.", error);
  }

  applyOfflineDecay();
  saveState();
}

function saveState() {
  state.lastUpdate = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyOfflineDecay() {
  const current = Date.now();
  const previous = Number(state.lastUpdate) || current;

  if (current <= previous) {
    state.lastUpdate = current;
    return;
  }

  let normalMs = current - previous;
  let protectedMs = 0;

  if (state.protectionUntil > previous) {
    protectedMs = Math.max(
      0,
      Math.min(current, state.protectionUntil) - previous
    );

    normalMs -= protectedMs;
  }

  const normalHours = normalMs / 3600000;
  const protectedHours = protectedMs / 3600000;

  state.oxygen = clamp(
    state.oxygen -
      CONFIG.decayPerHour.oxygen *
        (normalHours +
          protectedHours * CONFIG.protectionDecayMultiplier)
  );

  state.food = clamp(
    state.food -
      CONFIG.decayPerHour.food *
        (normalHours +
          protectedHours * CONFIG.protectionDecayMultiplier)
  );

  state.clean = clamp(
    state.clean -
      CONFIG.decayPerHour.clean *
        (normalHours +
          protectedHours * CONFIG.protectionDecayMultiplier)
  );

  state.lastUpdate = current;
}

function getStability() {
  return clamp((state.oxygen + state.food + state.clean) / 3);
}

function getStatus(stability) {
  if (stability <= 0) {
    return {
      text: "COLAPSO",
      className: "collapsed"
    };
  }

  if (stability < 35) {
    return {
      text: "CRÍTICO",
      className: "critical"
    };
  }

  if (stability < 60) {
    return {
      text: "DETERIORADO",
      className: "degraded"
    };
  }

  if (stability < 80) {
    return {
      text: "SALUDABLE",
      className: "healthy"
    };
  }

  return {
    text: "PERFECTO",
    className: "perfect"
  };
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => String(value).padStart(2, "0"))
    .join(":");
}

function formatProtection(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => String(value).padStart(2, "0"))
    .join(":");
}

function setText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

function setWidth(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.style.width = `${clamp(value)}%`;
  }
}

function updateAquariumStatus(status) {
  const app = document.getElementById("app");

  if (!app) return;

  app.classList.remove(
    "perfect",
    "healthy",
    "degraded",
    "critical",
    "collapsed"
  );

  app.classList.add(status.className);
}

function updateUI() {
  const current = Date.now();
  const stability = getStability();
  const status = getStatus(stability);

  const survivalMs = Math.max(0, current - state.createdAt);

  if (stability > 0) {
    state.recordMs = Math.max(state.recordMs || 0, survivalMs);
  }

  const dayNumber = Math.floor(survivalMs / 86400000) + 1;
  const timeInsideDay = survivalMs % 86400000;

  setText("day", `DÍA ${dayNumber}`);
  setText("clock", formatClock(timeInsideDay));

  setText("stability", `${Math.round(stability)}%`);
  setText("status", status.text);

  setText("oxygen", `${Math.round(state.oxygen)}%`);
  setText("foodValue", `${Math.round(state.food)}%`);
  setText("clean", `${Math.round(state.clean)}%`);

  setWidth("oxygenFill", state.oxygen);
  setWidth("foodFill", state.food);
  setWidth("cleanFill", state.clean);

  const oxygenBar = document.getElementById("oxygenBar");
  const foodBar = document.getElementById("foodBar");
  const cleanBar = document.getElementById("cleanBar");

  if (oxygenBar) oxygenBar.value = state.oxygen;
  if (foodBar) foodBar.value = state.food;
  if (cleanBar) cleanBar.value = state.clean;

  updateAquariumStatus(status);

  const protectionElement = document.getElementById("protection");
  const rewardButton = document.getElementById("reward");

  if (state.protectionUntil > current) {
    const remaining = state.protectionUntil - current;

    if (protectionElement) {
      protectionElement.textContent =
        `ACTIVA · ${formatProtection(remaining)}`;
    }

    if (rewardButton) {
      rewardButton.disabled = true;
      rewardButton.textContent = "PROTECCIÓN ACTIVA";
    }
  } else {
    if (state.protectionUntil !== 0) {
      state.protectionUntil = 0;
    }

    if (current < state.nextProtectionAt) {
      const remaining = state.nextProtectionAt - current;

      if (protectionElement) {
        protectionElement.textContent =
          `Disponible en ${formatProtection(remaining)}`;
      }

      if (rewardButton) {
        rewardButton.disabled = true;
        rewardButton.textContent =
          `DISPONIBLE EN ${formatProtection(remaining)}`;
      }
    } else {
      if (protectionElement) {
        protectionElement.textContent = "Disponible";
      }

      if (rewardButton) {
        rewardButton.disabled = false;

        if (state.rewardAdsWatched === 0) {
          rewardButton.textContent = "VER 2 ANUNCIOS";
        } else {
          rewardButton.textContent = "VER SEGUNDO ANUNCIO";
        }
      }
    }
  }
}

function createBubble() {
  const container = document.getElementById("bubbles");

  if (!container) return;

  const bubble = document.createElement("span");

  bubble.className = "bubble";
  bubble.style.left = `${8 + Math.random() * 84}%`;
  bubble.style.width = `${4 + Math.random() * 8}px`;
  bubble.style.height = bubble.style.width;
  bubble.style.animationDuration = `${3 + Math.random() * 4}s`;

  container.appendChild(bubble);

  setTimeout(() => {
    bubble.remove();
  }, 7500);
}

function createFoodParticle() {
  const container = document.getElementById("food");

  if (!container) return;

  const particle = document.createElement("span");

  particle.className = "food-particle";
  particle.style.left = `${20 + Math.random() * 60}%`;
  particle.style.animationDuration = `${2 + Math.random() * 2}s`;

  container.appendChild(particle);

  setTimeout(() => {
    particle.remove();
  }, 4500);
}

function maintenanceEffect(type) {
  if (type === "oxygen") {
    for (let i = 0; i < 5; i++) {
      setTimeout(createBubble, i * 120);
    }
  }

  if (type === "food") {
    for (let i = 0; i < 5; i++) {
      setTimeout(createFoodParticle, i * 130);
    }
  }

  if (type === "clean") {
    const aquarium = document.getElementById("aquarium");

    if (aquarium) {
      aquarium.classList.add("filtering");

      setTimeout(() => {
        aquarium.classList.remove("filtering");
      }, 700);
    }
  }
}

function startMaintenance(type, button) {
  if (activeTasks[type]) return;

  const config = CONFIG.maintenance[type];

  if (!config) return;

  if (state[type] >= 95) {
    const original = button.textContent;

    button.textContent =
      type === "food"
        ? "NO NECESITA ALIMENTO"
        : type === "oxygen"
        ? "OXÍGENO SUFICIENTE"
        : "AGUA LIMPIA";

    setTimeout(() => {
      button.textContent = original;
    }, 1800);

    return;
  }

  const originalText = button.textContent;
  const startedAt = Date.now();
  const initialValue = state[type];

  button.disabled = true;

  activeTasks[type] = setInterval(() => {
    const current = Date.now();
    const elapsedSeconds = (current - startedAt) / 1000;
    const progress = Math.min(1, elapsedSeconds / config.duration);

    const multiplier =
      state.protectionUntil > current
        ? CONFIG.protectionMaintenanceMultiplier
        : 1;

    const targetGain = config.gain * multiplier;

    state[type] = clamp(initialValue + targetGain * progress);

    maintenanceEffect(type);

    const remaining = Math.max(
      0,
      Math.ceil(config.duration - elapsedSeconds)
    );

    button.textContent = `${remaining}s`;

    updateUI();

    if (progress >= 1) {
      clearInterval(activeTasks[type]);
      activeTasks[type] = null;

      state[type] = clamp(initialValue + targetGain);

      button.disabled = false;
      button.textContent = originalText;

      saveState();
      updateUI();
    }
  }, 1000);
}

async function activateReward() {
  const button = document.getElementById("reward");
  const current = Date.now();

  if (!button) return;

  if (
    state.protectionUntil > current ||
    current < state.nextProtectionAt
  ) {
    return;
  }

  try {
    await AdMob.prepareRewardVideoAd({
      adId: "ca-app-pub-3940256099942544/5224354917"
    });

    await AdMob.showRewardVideoAd();
  } catch (error) {
    console.error("Error mostrando anuncio recompensado:", error);
    return;
  }

  state.rewardAdsWatched += 1;

  if (state.rewardAdsWatched < 2) {
    button.textContent = "VER SEGUNDO ANUNCIO";
    saveState();
    return;
  }

  state.rewardAdsWatched = 0;
  state.protectionUntil = current + CONFIG.protectionDuration;
  state.nextProtectionAt = current + CONFIG.protectionCooldown;

  saveState();
  updateUI();
}

function attachEvents() {
  document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
      startMaintenance(button.dataset.action, button);
    });
  });

  const rewardButton = document.getElementById("reward");

  if (rewardButton) {
    rewardButton.addEventListener("click", activateReward);
  }
}

function gameTick() {
  const current = Date.now();
  const elapsedMs = current - state.lastUpdate;

  if (elapsedMs > 0) {
    const hours = elapsedMs / 3600000;

    const decayMultiplier =
      state.protectionUntil > current
        ? CONFIG.protectionDecayMultiplier
        : 1;

    state.oxygen = clamp(
      state.oxygen -
        CONFIG.decayPerHour.oxygen * hours * decayMultiplier
    );

    state.food = clamp(
      state.food -
        CONFIG.decayPerHour.food * hours * decayMultiplier
    );

    state.clean = clamp(
      state.clean -
        CONFIG.decayPerHour.clean * hours * decayMultiplier
    );

    state.lastUpdate = current;
  }

  updateUI();
}


async function initializeAdMob() {
  try {
    await AdMob.initialize({
      initializeForTesting: true
    });

    await AdMob.showBanner({
      adId: "ca-app-pub-3940256099942544/6300978111",
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0
    });

    console.log("AdMob de prueba iniciado correctamente");
  } catch (error) {
    console.error("Error iniciando AdMob:", error);
  }
}

loadState();
attachEvents();
updateUI();
initializeAdMob();

setInterval(gameTick, 1000);
setInterval(saveState, 15000);
setInterval(createBubble, 900);

window.addEventListener("beforeunload", saveState);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    applyOfflineDecay();
    updateUI();
  } else {
    saveState();
  }
});
