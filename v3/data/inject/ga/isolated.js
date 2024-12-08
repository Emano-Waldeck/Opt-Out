let port;
try {
  port = document.getElementById('ghj2rt-port');
  port.remove();
}
catch (e) {
  port = document.createElement('span');
  port.id = 'ghj2rt-port';
  document.documentElement.append(port);
}


let count = 0;

port.addEventListener('ga-count', e => {
  e.preventDefault();
  e.stopPropagation();
  count += 1;

  if (window.top === window) {
    chrome.runtime.sendMessage({
      method: 'ga-report-top',
      count
    });
  }
  else {
    chrome.runtime.sendMessage({
      method: 'ga-report-frame'
    });
  }
});
