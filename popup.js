let hours = 1;
let currentDomain = null;

const hoursValue = document.getElementById('hoursValue');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const blockBtn = document.getElementById('blockBtn');
const currentSite = document.getElementById('currentSite');
const blockedSites = document.getElementById('blockedSites');

// Get current tab's root domain
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url) {
    try {
      const url = new URL(tabs[0].url);
      currentDomain = url.hostname;
      currentSite.textContent = currentDomain;
    } catch (e) {
      currentSite.textContent = 'Geen geldige URL';
      blockBtn.disabled = true;
    }
  }
});

// Timer controls
decreaseBtn.addEventListener('click', () => {
  if (hours > 1) {
    hours--;
    hoursValue.textContent = hours;
  }
});

increaseBtn.addEventListener('click', () => {
  if (hours < 24) {
    hours++;
    hoursValue.textContent = hours;
  }
});

// Block current site
blockBtn.addEventListener('click', async () => {
  if (!currentDomain) return;

  const endTime = Date.now() + (hours * 60 * 60 * 1000);

  // Send message to background to add block rule
  chrome.runtime.sendMessage({
    action: 'blockSite',
    domain: currentDomain,
    endTime: endTime
  }, () => {
    loadBlockedSites();
  });
});

// Load and display blocked sites
async function loadBlockedSites() {
  const { blockedDomains = {} } = await chrome.storage.local.get('blockedDomains');

  blockedSites.innerHTML = '';

  const now = Date.now();
  const activeDomains = Object.entries(blockedDomains).filter(([_, endTime]) => endTime > now);

  if (activeDomains.length === 0) {
    blockedSites.innerHTML = '<div class="empty">Geen geblokkeerde sites</div>';
    return;
  }

  activeDomains.forEach(([domain, endTime]) => {
    const timeLeft = Math.ceil((endTime - now) / (60 * 60 * 1000));
    const item = document.createElement('div');
    item.className = 'blocked-item';
    item.innerHTML = `
      <span class="domain">${domain}</span>
      <span class="time-left">${timeLeft}u</span>
      <button class="unblock-btn" data-domain="${domain}">✕</button>
    `;
    blockedSites.appendChild(item);
  });

  // Add unblock handlers
  document.querySelectorAll('.unblock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'unblockSite',
        domain: btn.dataset.domain
      }, () => {
        loadBlockedSites();
      });
    });
  });
}

loadBlockedSites();
