document.addEventListener('DOMContentLoaded', () => {
  updatePopup();

  document.getElementById('reset-daily').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'resetDailyDiamonds' }, (response) => {
      if (response.success) {
        document.getElementById('daily-diamond-count').textContent = 'Diamonds collected today: 0';
        updateBadge();
      }
    });
  });

  document.getElementById('reset-total').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'resetTotalDiamonds' }, (response) => {
      if (response.success) {
        document.getElementById('diamond-count').textContent = '0';
      }
    });
  });
});

function updatePopup() {
  chrome.storage.local.get(['status', 'diamondCount', 'lastCollectTime', 'dailyDiamonds'], (data) => {
    document.getElementById('status').textContent = data.status || 'No status available';
    document.getElementById('diamond-count').textContent = data.diamondCount || 0;
    document.getElementById('last-collect-time').textContent = data.lastCollectTime ? `Last collect: ${new Date(data.lastCollectTime).toLocaleString()}` : 'Last collect: Never';
    document.getElementById('daily-diamond-count').textContent = `Diamonds collected today: ${data.dailyDiamonds || 0}`;
  });
}

function updateBadge() {
  chrome.storage.local.get(['dailyDiamonds'], (data) => {
    let badgeText = (data.dailyDiamonds || 0).toString();
    chrome.action.setBadgeText({ text: badgeText });
  });
}
