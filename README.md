# CricHD Clean

Personal Chrome extension targeting the ad behavior observed on https://crichd.pk/charlie/manchester-city-vs-coventry-city/1664.

## Install

On Windows, download `crichd-clean.zip` from this repository's Releases page, right-click it and choose **Extract All**. Keep the extracted folder somewhere permanent.

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** at the top right.
3. Click **Load unpacked** and select the extracted `crichd-clean` folder containing `manifest.json`. When installing from a source checkout, select its `extension` subfolder instead.
4. Reload your CricHD tab.

Select the folder containing `manifest.json` directly, not the ZIP or a parent folder. No Node.js installation or build is needed to use the extension.

Disable the extension on the same screen and reload to undo it. After editing extension files, click its Reload button there, then reload the website.

## Behavior

- Blocks the site's obfuscated `/assets/js/jquery.js` ad loader and known ad endpoints.
- Removes known ad links and marked ad containers, including those inserted later.
- Suppresses `window.open` and external new-tab links on CricHD and its observed player frames (`playeraio.top` and `bhalocast.pro`). The Cricket navigation link stays available.
- Keeps ordinary navigation, player frames, video controls, and chat markup.
- No build step, background service, analytics, or stored browsing data.

The popup guard also disables social-share popups and external new-tab player links. Player scripts run only when embedded under CricHD; network rules for known ad hosts apply to requests initiated by the three listed domains, including standalone player pages. No access to every website is requested.

This is a targeted first version, not a guarantee against every ad. New player domains, other cross-origin frames, same-tab redirects to unknown ad hosts, and ads inside the video need additional rules. The extension does not bypass access controls. The nested player did not return playable content during inspection, so live playback has not been verified.

## Development

`npm install`, `npx playwright install chromium`, then `npm test`.

Implementation references: [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) and [network request rules](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest).
