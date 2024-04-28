'use strict';

chrome.runtime.onMessage.addListener((request, sender) => {
  const tabId = sender.tab.id;
  if (request.method === 'ga-report-top') {
    if (request.count === 1) {
      chrome.action.setIcon({
        tabId,
        path: {
          '16': '/data/icons/active/16.png',
          '32': '/data/icons/active/32.png',
          '48': '/data/icons/active/48.png'
        }
      });
    }
    chrome.action.setBadgeText({
      tabId,
      text: request.count.toString()
    });
  }
  else if (request.method === 'ga-report-frame') {
    chrome.tabs.sendMessage(tabId, {
      method: 'increment'
    });
  }
});

chrome.action.setBadgeBackgroundColor({
  color: '#929292'
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
