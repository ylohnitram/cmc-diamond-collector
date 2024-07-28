function isLoggedIn() {
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

function detectSuccessfulLogin() {
  const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        const successMessage = [...document.querySelectorAll('div')].find(div => div.textContent.includes('You have successfully logged in!'));
        if (successMessage) {
          console.log('Detected successful login.');
          observer.disconnect();
          chrome.runtime.sendMessage({ type: 'openDiamondPage' });
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function collectDiamonds() {
  if (!isLoggedIn()) {
    console.log('User not logged in, notifying user...');
    notifyUserToLogin();
    setTimeout(openLoginModal, 1000); // Pokusit se otevřít modální dialog pro přihlášení po 1 sekundě
    detectSuccessfulLogin();
    return;
  }

  console.log('User is logged in, attempting to collect diamonds...');
  chrome.runtime.sendMessage({ type: 'openDiamondPage' });
}

// Spusť funkci collectDiamonds po načtení stránky
window.addEventListener('load', () => {
  setTimeout(collectDiamonds, 5000); // Počkej 5 sekund pro jistotu, že se stránka plně načte
});
