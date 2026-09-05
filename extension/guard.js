(() => {
  const isSite = (host) => host === 'crichd.pk' || host.endsWith('.crichd.pk');
  const onSite = isSite(location.hostname) ||
    Array.from(location.ancestorOrigins || []).some(origin => isSite(new URL(origin).hostname));
  if (!onSite) return;

  // Popunder scripts also open blank windows and navigate them later.
  // Intentionally suppress all window.open calls, including share popups.
  Object.defineProperty(window, 'open', {
    value: () => null, writable: false, configurable: false
  });

  // The page calls this ad API inline, even when its loader is blocked.
  const noop = () => {};
  const aclib = Object.freeze({ runPop: noop, runAutoTag: noop, runBanner: noop });
  Object.defineProperty(window, 'aclib', {
    get: () => aclib, set: noop, configurable: false
  });
})();
