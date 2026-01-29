// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ blockedDomains: {} });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'blockSite') {
    blockSite(message.domain, message.endTime).then(() => sendResponse());
    return true;
  }
  if (message.action === 'unblockSite') {
    unblockSite(message.domain).then(() => sendResponse());
    return true;
  }
});

async function blockSite(domain, endTime) {
  const { blockedDomains = {} } = await chrome.storage.local.get('blockedDomains');
  blockedDomains[domain] = endTime;
  await chrome.storage.local.set({ blockedDomains });
}

async function unblockSite(domain) {
  const { blockedDomains = {} } = await chrome.storage.local.get('blockedDomains');
  delete blockedDomains[domain];
  await chrome.storage.local.set({ blockedDomains });
}

// Check if a URL should be blocked
async function shouldBlock(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const { blockedDomains = {} } = await chrome.storage.local.get('blockedDomains');
    const now = Date.now();

    // Check if domain matches any blocked domain
    for (const [blockedDomain, endTime] of Object.entries(blockedDomains)) {
      if (endTime > now && (domain === blockedDomain || domain.endsWith('.' + blockedDomain))) {
        return blockedDomain;
      }
    }
  } catch (e) {
    // Invalid URL
  }
  return null;
}

// Clean up expired blocks
async function cleanupExpired() {
  const { blockedDomains = {} } = await chrome.storage.local.get('blockedDomains');
  const now = Date.now();
  const cleaned = Object.fromEntries(
    Object.entries(blockedDomains).filter(([_, endTime]) => endTime > now)
  );
  await chrome.storage.local.set({ blockedDomains: cleaned });
}

// Intercept navigation
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only check main frame navigations
  if (details.frameId !== 0) return;

  // Don't block our own blocked page
  if (details.url.startsWith('chrome-extension://')) return;

  const blockedDomain = await shouldBlock(details.url);
  if (blockedDomain) {
    const blockedUrl = chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(blockedDomain)}`);
    chrome.tabs.update(details.tabId, { url: blockedUrl });
  }
});

// Clean up every minute
setInterval(cleanupExpired, 60000);
cleanupExpired();
