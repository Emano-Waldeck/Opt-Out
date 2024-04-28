'use strict';
{
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.textContent = `window['_gaUserPrefs'] = {
    ioo: () => {
      window.top.postMessage({
        method: 'ga-request'
      }, '*');
      return true;
    }
  }`;
  document.documentElement.appendChild(script);
  document.documentElement.removeChild(script);
}

var count = 0;
if (window === window.top) {
  window.addEventListener('message', ({data}) => {
    if (data && data.method === 'ga-request') {
      count += 1;
      chrome.runtime.sendMessage({
        method: 'ga-request',
        count
      });
    }
  });
}
