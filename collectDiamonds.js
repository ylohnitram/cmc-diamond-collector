function collectDiamonds() {
  console.log('Attempting to collect diamonds...');

  // Zkontrolujeme, zda skript není spuštěn uvnitř iframe
  if (window.self !== window.top) {
    console.log('Script is running inside an iframe, exiting...');
    return;
  }

  function findAndClickButton() {
    console.log('Finding diamond button using specific selector...');

    // Selektor pro nalezení tlačítka "Collect Diamonds" pomocí textu
    const diamondButton = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Collect Diamonds'));

    if (diamondButton) {
      console.log('Found diamond button:', diamondButton);
      console.log('Button HTML:', diamondButton.outerHTML);
      console.log('Button text:', diamondButton.textContent);
      console.log('Diamond button is enabled and visible. Clicking...');

      // Klikneme na tlačítko
      diamondButton.click();

      // Create a MutationObserver to monitor DOM changes
      const observer = new MutationObserver((mutationsList, observer) => {
        for (let mutation of mutationsList) {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            // Check all text nodes in the document
            const allTextNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = allTextNodes.nextNode()) {
              if (node.nodeValue && node.nodeValue.toLowerCase().includes('yay, you\'ve collected')) {
                const collectedDiamonds = parseInt(node.nodeValue.match(/\d+/)[0], 10);
                console.log(`Diamond collected successfully! Collected ${collectedDiamonds} diamonds.`);
                observer.disconnect(); // Stop observing
                chrome.storage.local.get('diamondCount', (data) => {
                  let newCount = (data.diamondCount || 0) + collectedDiamonds;
                  let currentTime = new Date().toISOString();
                  chrome.storage.local.set({ diamondCount: newCount, lastCollectTime: currentTime }, () => {
                    chrome.runtime.sendMessage({ type: 'updateStatus', status: 'Diamond collected!' });
                    chrome.runtime.sendMessage({ type: 'diamondCollected' }, () => {
                      if (chrome.runtime.lastError) {
                        console.error('Error sending diamondCollected message:', chrome.runtime.lastError);
                      } else {
                        console.log('diamondCollected message sent successfully.');
                      }
                    });
                  });
                });
                return;
              }
            }
          }
        }
      });

      // Observe changes in the document body
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    } else {
      console.log('Diamond button not found. Logging the entire HTML for debugging.');
      console.log(document.documentElement.outerHTML); // Logování celé struktury HTML
      chrome.runtime.sendMessage({ type: 'updateStatus', status: 'Diamond button not found or not ready for collection.' });
    }
  }

  console.log('Page loaded, waiting before finding button...');
  setTimeout(() => {
    console.log('30 seconds have passed, finding and clicking the button now.');
    findAndClickButton();
  }, 30000); // Wait 30 seconds to ensure the page fully loads
}

// Execute collectDiamonds function
collectDiamonds();
