let diamondTabId = null;
let diamondTabReloadInterval = 1800000; // 30 minut
let stopReloading = false;

chrome.runtime.onInstalled.addListener(() => {
  console.log('CMC Diamond Collector installed.');
  resetDailyDiamonds();
  updateBadge();
  startDiamondTabMonitoring(); // Začneme monitorovat stránku s diamanty
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
  startDiamondTabMonitoring(); // Začneme monitorovat stránku s diamanty při startu
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateStatus') {
    chrome.storage.local.set({ status: request.status }, () => {
      console.log('Status updated:', request.status);
    });
  }
  if (request.type === 'diamondCollected') {
    console.log('diamondCollected message received.');
    updateDailyDiamonds();
  }
  if (request.type === 'resetDailyDiamonds') {
    chrome.storage.local.set({ dailyDiamonds: 0 }, () => {
      updateBadge();
      sendResponse({ success: true });
    });
  }
  if (request.type === 'resetTotalDiamonds') {
    chrome.storage.local.set({ diamondCount: 0 }, () => {
      sendResponse({ success: true });
    });
  }
  if (request.type === 'notifyLogin') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/diamond.png',
      title: 'CMC Diamond Collector',
      message: 'Please log in to CoinMarketCap to collect diamonds.',
      priority: 2
    });
    sendResponse({ success: true });
  }
  if (request.type === 'openDiamondPage') {
    if (diamondTabId === null) {
      openOrReloadDiamondPage();
    } else {
      console.log('Diamond tab is already open, not opening another.');
    }
    sendResponse({ success: true });
  }
  if (request.type === 'stopReloading') {
    stopReloading = true;
    sendResponse({ success: true });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && changeInfo.status === 'complete' && tab.url.includes('coinmarketcap.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }

  if (tabId === diamondTabId && changeInfo.status === 'complete' && tab.url.includes('coinmarketcap.com/account/my-diamonds')) {
    console.log('Diamond tab loaded:', tabId);
    // Počkej 30 sekund před spuštěním skriptu na stránce s diamanty
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: diamondTabId },
        files: ['collectDiamonds.js']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to execute script in diamond tab:', chrome.runtime.lastError);
        }
      });
    }, 30000); // Wait 30 seconds before executing the script
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === diamondTabId) {
    diamondTabId = null;
    chrome.runtime.sendMessage({ type: 'openDiamondPage' });
  }
});

function resetDailyDiamonds() {
  let today = new Date().toISOString().split('T')[0];
  chrome.storage.local.get(['lastResetDate'], (data) => {
    if (data.lastResetDate !== today) {
      chrome.storage.local.set({ dailyDiamonds: 0, lastResetDate: today }, () => {
        updateBadge();
      });
    }
  });
}

function updateDailyDiamonds() {
  chrome.storage.local.get(['dailyDiamonds'], (data) => {
    let newCount = (data.dailyDiamonds || 0) + 1;
    chrome.storage.local.set({ dailyDiamonds: newCount }, () => {
      updateBadge();
      console.log('Updated daily diamonds count:', newCount);
    });
  });
}

function updateBadge() {
  chrome.storage.local.get(['dailyDiamonds'], (data) => {
    let badgeText = (data.dailyDiamonds || 0).toString();
    chrome.action.setBadgeText({ text: badgeText });
    console.log('Badge updated to:', badgeText);
  });
}

function openOrReloadDiamondPage() {
  if (diamondTabId === null) {
    chrome.tabs.create({ url: 'https://coinmarketcap.com/account/my-diamonds/', active: false }, (newTab) => {
      diamondTabId = newTab.id;
      stopReloading = false;
      scheduleNextReload();
    });
  } else {
    chrome.tabs.update(diamondTabId, { url: 'https://coinmarketcap.com/account/my-diamonds/', active: false }, (updatedTab) => {
      stopReloading = false;
      scheduleNextReload();
    });
  }
}

function scheduleNextReload() {
  setTimeout(() => {
    if (!stopReloading) {
      openOrReloadDiamondPage();
    }
  }, diamondTabReloadInterval);
}

function startDiamondTabMonitoring() {
  if (diamondTabId === null) {
    openOrReloadDiamondPage();
  } else {
    scheduleNextReload();
  }
}

// Reset daily diamond count every day
setInterval(resetDailyDiamonds, 60 * 60 * 1000); // Check reset every hour
