chrome.runtime.onInstalled.addListener(() => {
  console.log('CMC Diamond Collector installed.');
  resetDailyDiamonds();
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateStatus') {
    chrome.storage.local.set({ status: request.status }, () => {
      console.log('Status updated:', request.status);
    });
  }
  if (request.type === 'diamondCollected') {
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
  }
  if (request.type === 'openDiamondPage') {
    chrome.tabs.create({ url: 'https://coinmarketcap.com/account/my-diamonds/' }, (newTab) => {
      chrome.tabs.onUpdated.addListener(function diamondPageListener(tabId, changeInfo, tab) {
        if (tabId === newTab.id && changeInfo.status === 'complete' && tab.url.includes('coinmarketcap.com/account/my-diamonds/')) {
          chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            files: ['collectDiamonds.js']
          });
          chrome.tabs.onUpdated.removeListener(diamondPageListener);
        }
      });
    });
    sendResponse({ success: true });
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
    });
  });
}

function updateBadge() {
  chrome.storage.local.get(['dailyDiamonds'], (data) => {
    let badgeText = (data.dailyDiamonds || 0).toString();
    chrome.action.setBadgeText({ text: badgeText });
  });
}

// Reset denního počtu diamantů každý den
setInterval(resetDailyDiamonds, 60 * 60 * 1000); // Každou hodinu kontrolujeme reset
