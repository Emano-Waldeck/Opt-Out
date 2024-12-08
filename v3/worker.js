'use strict';

chrome.action.onClicked.addListener(tab => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url,
  index: tab.index + 1
}));

chrome.runtime.onMessage.addListener((request, sender) => {
  const tabId = sender.tab.id;
  if (request.method === 'ga-report-top') {
    chrome.action.setBadgeText({
      tabId,
      text: request.count.toString()
    });
  }
  else if (request.method === 'ga-report-frame') {
    chrome.declarativeNetRequest.setExtensionActionOptions({
      tabUpdate: {
        tabId: sender.tab.id,
        increment: 1
      }
    });
  }
});

//
{
  const configure = async () => {
    const prefs = await chrome.storage.local.get({
      'opt-out': [],
      'network': ['ga', 'adobe']
    });

    const scripts = [];
    const ids = [];
    for (const name of ['ga']) {
      ids.push(name + '_iso', name + '_mn');

      if (prefs['opt-out'].includes(name)) {
        scripts.push({
          'id': name + '_iso',
          'matches': ['*://*/*'],
          'js': ['/data/inject/' + name + '/isolated.js'],
          'runAt': 'document_start',
          'allFrames': true,
          'matchOriginAsFallback': true,
          'world': 'ISOLATED'
        }, {
          'id': name + '_mn',
          'matches': ['*://*/*'],
          'js': ['/data/inject/' + name + '/main.js'],
          'runAt': 'document_start',
          'allFrames': true,
          'matchOriginAsFallback': true,
          'world': 'MAIN'
        });
      }
    }
    if (ids.length) {
      for (const id of ids) {
        await chrome.scripting.unregisterContentScripts({
          ids: [id]
        }).catch(() => {});
      }
    }
    if (scripts.length) {
      await chrome.scripting.registerContentScripts(scripts);
    }

    const disableRulesetIds = [];
    const enableRulesetIds = [];
    for (const name of ['ga', 'adobe']) {
      if (prefs.network.includes(name)) {
        enableRulesetIds.push(name);
      }
      else {
        disableRulesetIds.push(name);
      }
    }
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds,
      enableRulesetIds
    });
    let title = chrome.runtime.getManifest().name + '\n\n';
    title += 'Opt-out: ' + (scripts.length ? scripts.map(o => o.id).join(', ') : '-');
    title += '\n';
    title += 'Network: ' + (enableRulesetIds.length ? enableRulesetIds.join(', ') : '-');

    chrome.action.setTitle({
      title
    });

    const m = enableRulesetIds.length === 0 && scripts.length === 0;
    chrome.action.setIcon({
      path: {
        '16': '/data/icons/' + (m ? 'disabled/' : '') + '16.png',
        '32': '/data/icons/' + (m ? 'disabled/' : '') + '32.png',
        '48': '/data/icons/' + (m ? 'disabled/' : '') + '48.png'
      }
    });
  };
  chrome.runtime.onStartup.addListener(configure);
  chrome.runtime.onInstalled.addListener(configure);
  chrome.storage.onChanged.addListener(ps => {
    if ('opt-out' in ps || 'network' in ps) {
      configure();
    }
  });
}

// once
{
  const once = () => {
    if (once.done) {
      return;
    }
    once.done = true;

    if ('setExtensionActionOptions' in chrome.declarativeNetRequest) {
      chrome.declarativeNetRequest.setExtensionActionOptions({
        displayActionCountAsBadgeText: true
      });
    }
    chrome.action.setBadgeBackgroundColor({
      color: '#929292'
    });
  };
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

// context menu
{
  const once = async () => {
    if (once.done) {
      return;
    }
    once.done = true;

    const prefs = await chrome.storage.local.get({
      'opt-out': [],
      'network': ['ga', 'adobe']
    });

    chrome.contextMenus.create({
      id: 'opt-out',
      title: 'Opt-out Methods',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'opt-out-ga',
      title: 'Google Analytics',
      contexts: ['action'],
      type: 'checkbox',
      checked: prefs['opt-out'].includes('ga'),
      parentId: 'opt-out'
    });
    chrome.contextMenus.create({
      id: 'network',
      title: 'Network Methods',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'network-ga',
      title: 'Google Analytics',
      contexts: ['action'],
      type: 'checkbox',
      checked: prefs.network.includes('ga'),
      parentId: 'network'
    });
    chrome.contextMenus.create({
      id: 'network-adobe',
      title: 'Adobe Analytics',
      contexts: ['action'],
      type: 'checkbox',
      checked: prefs.network.includes('adobe'),
      parentId: 'network'
    });
  };
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}
chrome.contextMenus.onClicked.addListener(async info => {
  if (info.menuItemId.startsWith('network-')) {
    const prefs = await chrome.storage.local.get({
      'network': ['ga', 'adobe']
    });
    const name = info.menuItemId.replace('network-', '');
    if (info.checked && prefs.network.includes(name) === false) {
      prefs.network.push(name);
    }
    if (info.checked === false && info.menuItemId.includes(name)) {
      prefs.network = prefs.network.filter(n => n !== name);
    }
    chrome.storage.local.set(prefs);
  }
  else if (info.menuItemId.startsWith('opt-out-')) {
    const prefs = await chrome.storage.local.get({
      'opt-out': []
    });
    const name = info.menuItemId.replace('opt-out-', '');
    if (info.checked && prefs['opt-out'].includes(name) === false) {
      prefs['opt-out'].push(name);
    }
    if (info.checked === false && info.menuItemId.includes(name)) {
      prefs['opt-out'] = prefs['opt-out'].filter(n => n !== name);
    }
    chrome.storage.local.set(prefs);
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
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
