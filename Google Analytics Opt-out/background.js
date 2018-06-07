'use strict';

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'ga-request') {
    const tabId = sender.tab.id;
    chrome.pageAction.show(tabId);
    chrome.pageAction.setTitle({
      tabId,
      title: request.count + ' rejected GA requests'
    });
  }
});

chrome.pageAction.onClicked.addListener(() => chrome.tabs.executeScript({
  code: 'window.alert(count + " rejected GA requests")'
}));
