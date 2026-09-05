(() => {
  const isSite = (host) => host === 'crichd.pk' || host.endsWith('.crichd.pk');
  if (!isSite(location.hostname) &&
      !Array.from(location.ancestorOrigins || []).some(origin => isSite(new URL(origin).hostname))) return;

  const adHosts = ['zyyvyfkeydwgv.online', 'acscdn.com', 'aclib.net', 'adcash.com'];
  const adSelector = '[data-ad-slot], ins.adsbygoogle, .ad-banner, .ad-container, #ad-overlay, .ad-overlay';
  const isAdUrl = (value) => {
    try {
      const url = new URL(value, location.href);
      return adHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)) ||
        /\/ad\/visit\.php$/i.test(url.pathname);
    } catch { return false; }
  };

  function clean(root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches(adSelector)) {
      root.remove();
      return;
    }
    root.querySelectorAll(adSelector).forEach(element => element.remove());
    const elements = [...root.querySelectorAll('a[href], iframe[src]')];
    if (root instanceof Element && root.matches('a[href], iframe[src]')) elements.push(root);
    for (const element of elements) {
      if (isAdUrl(element.getAttribute('href') || element.getAttribute('src'))) element.remove();
    }
  }

  // Block ad clicks synchronously, including links created and clicked before
  // the MutationObserver gets a chance to remove them.
  for (const type of ['click', 'auxclick']) {
    window.addEventListener(type, event => {
      const link = event.composedPath().find(node => node instanceof Element && node.matches('a[href]'));
      if (!link) return;
      let newExternalTab = false;
      try {
        const url = new URL(link.getAttribute('href'), location.href);
        newExternalTab = link.target.toLowerCase() === '_blank' &&
          url.origin !== location.origin && !isSite(url.hostname) &&
          url.hostname !== 'crichd.live' && !url.hostname.endsWith('.crichd.live');
      } catch { /* Malformed URLs cannot identify an ad destination. */ }
      if (isAdUrl(link.href) || newExternalTab) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') clean(record.target);
      else record.addedNodes.forEach(clean);
    }
  }).observe(document, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ['href', 'src', 'class', 'id', 'data-ad-slot']
  });
  clean(document);
})();
