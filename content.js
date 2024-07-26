function isLoggedIn() {
  // Hledáme obecné prvky, které naznačují, že uživatel je přihlášen
  const loginButton = [...document.querySelectorAll('button'), ...document.querySelectorAll('a')].find(el => el.textContent.includes('Log In') || el.textContent.includes('Sign In'));
  console.log('Checking login status: login button found =', loginButton !== undefined);
  return loginButton === undefined;
}

function notifyUserToLogin() {
  alert('Please log in to CoinMarketCap to collect diamonds. You will be redirected to the login page.');
  chrome.runtime.sendMessage({ type: 'notifyLogin' });
}

function openLoginModal() {
  const loginButton = [...document.querySelectorAll('button'), ...document.querySelectorAll('a')].find(el => el.textContent.includes('Log In') || el.textContent.includes('Sign In'));
  if (loginButton) {
    console.log('Found login button:', loginButton);
    loginButton.click();
  } else {
    console.log('Login button not found');
  }
}

function collectDiamonds() {
  if (!isLoggedIn()) {
    console.log('User not logged in, notifying user...');
    notifyUserToLogin();
    setTimeout(openLoginModal, 1000); // Pokusit se otevřít modální dialog pro přihlášení po 1 sekundě
    return;
  }

  console.log('User is logged in, attempting to collect diamonds...');
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
          const successMessage = document.querySelector('.success-message'); // Nahraďte správným selektorem, pokud existuje
          if (successMessage && successMessage.innerText.toLowerCase().includes('success')) {
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
