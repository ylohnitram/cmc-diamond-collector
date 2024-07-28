function collectDiamonds() {
  const buttons = [...document.querySelectorAll('button')];
  let diamondButton = null;

  buttons.forEach(button => {
    if (button.innerText.toLowerCase().includes('collect') && button.innerText.toLowerCase().includes('diamonds')) {
      diamondButton = button;
    }
  });

  if (diamondButton && !diamondButton.disabled) {
    console.log('Found diamond button:', diamondButton);
    // Vytvoření MutationObserver pro sledování změn v DOM
    const observer = new MutationObserver((mutationsList, observer) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // Kontrolujeme všechny textové uzly v dokumentu
          const allTextNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while (node = allTextNodes.nextNode()) {
            if (node.nodeValue.toLowerCase().includes('you have collected')) {
              console.log('Diamond collected successfully!');
              observer.disconnect(); // Zastaví sledování změn
              chrome.storage.local.get('diamondCount', (data) => {
                let newCount = (data.diamondCount || 0) + 1;
                let currentTime = new Date().toISOString();
                chrome.storage.local.set({ diamondCount: newCount, lastCollectTime: currentTime }, () => {
                  chrome.runtime.sendMessage({ type: 'updateStatus', status: 'Diamond collected!' });
                  chrome.runtime.sendMessage({ type: 'diamondCollected' });
                });
              });
              return;
            }
          }
        }
      }
    });

    // Nastavení observeru na celé tělo dokumentu
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    // Kliknutí na tlačítko
    diamondButton.click();
  } else if (diamondButton && diamondButton.disabled) {
    console.log('Diamond button is disabled.');
    chrome.runtime.sendMessage({ type: 'updateStatus', status: 'Diamond button is disabled due to countdown or limit reached.' });
  } else {
    console.log('Diamond button not found.');
    chrome.runtime.sendMessage({ type: 'updateStatus', status: 'Diamond button not found or not ready for collection.' });
  }
}

// Spusť funkci collectDiamonds po načtení stránky
window.addEventListener('load', () => {
  setTimeout(collectDiamonds, 5000); // Počkej 5 sekund pro jistotu, že se stránka plně načte
});
