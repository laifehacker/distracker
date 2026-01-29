// Get blocked domain from URL parameter
const params = new URLSearchParams(window.location.search);
const blockedDomain = params.get('domain');

document.getElementById('domain').textContent = blockedDomain || 'onbekende site';

// Get end time from storage and start countdown
async function startCountdown() {
  const { blockedDomains = {} } = await chrome.storage.local.get('blockedDomains');
  const endTime = blockedDomains[blockedDomain];

  if (!endTime) {
    document.getElementById('hours').textContent = '--';
    document.getElementById('minutes').textContent = '--';
    document.getElementById('seconds').textContent = '--';
    return;
  }

  function updateCountdown() {
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) {
      // Block expired, reload to access site
      window.location.reload();
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

startCountdown();
