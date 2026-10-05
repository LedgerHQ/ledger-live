import type { Session } from "electron";

const AFFINITY_COOKIE = "__cflb";

export const EXPLORER_URL_PATTERNS = [
  "https://explorers.api.live.ledger.com/*",
  "https://explorers.api.live.ppr.ledger-test.com/*",
  "https://explorers.api.live.stg.ledger-test.com/*",
];

type AffinityCookie = { value: string; expiresAt: number };

const getHeaderValues = (headers: Record<string, string[]> | undefined, name: string) =>
  Object.entries(headers ?? {})
    .filter(([key]) => key.toLowerCase() === name)
    .flatMap(([, values]) => values);

export function parseAffinityCookie(setCookie: string, now: number): AffinityCookie | undefined {
  const [pair, ...attributes] = setCookie.split(";").map(part => part.trim());
  const separator = pair.indexOf("=");
  if (separator === -1 || pair.slice(0, separator) !== AFFINITY_COOKIE) return undefined;

  let expiresAt = Number.POSITIVE_INFINITY;
  let maxAge: number | undefined;
  for (const attribute of attributes) {
    const [key, ...rest] = attribute.split("=");
    const value = rest.join("=");
    switch (key.toLowerCase()) {
      case "max-age":
        maxAge = Number.parseInt(value, 10);
        break;
      case "expires": {
        const date = Date.parse(value);
        if (!Number.isNaN(date)) expiresAt = date;
        break;
      }
    }
  }
  if (maxAge !== undefined && !Number.isNaN(maxAge)) expiresAt = now + maxAge * 1000;

  return { value: pair.slice(separator + 1), expiresAt };
}

// Explorer paths are served by distinct load-balancer pools (e.g. `/a4` vs
// `/blockchain`) that reject each other's cookie, although all set it on `Path=/`.
const affinityKey = (url: string) => {
  const { host, pathname } = new URL(url);
  return `${host}/${pathname.split("/")[1] ?? ""}`;
};

const withAffinityCookie = (headers: Record<string, string>, value: string) => {
  const cookieKey = Object.keys(headers).find(key => key.toLowerCase() === "cookie") ?? "Cookie";
  const existing = headers[cookieKey];
  if (existing?.split(";").some(part => part.trim().startsWith(`${AFFINITY_COOKIE}=`))) {
    return headers;
  }
  const cookie = `${AFFINITY_COOKIE}=${value}`;
  return { ...headers, [cookieKey]: existing ? `${existing}; ${cookie}` : cookie };
};

/**
 * Replays Cloudflare's load-balancer affinity cookie on explorer requests so a
 * client keeps hitting the same explorer origin, as it already does on mobile.
 *
 * Chromium never stores it on its own: renderer requests are cross-site
 * (`file://` origin), uncredentialed, and the cookie is `SameSite=Lax`.
 * Electron keeps a single listener per webRequest event and session, so any
 * other `onBeforeSendHeaders` on the same session would replace this one.
 */
export function setupExplorerSessionAffinity(session: Session, now: () => number = Date.now) {
  const cookiesByPool = new Map<string, AffinityCookie>();
  const filter = { urls: EXPLORER_URL_PATTERNS };

  session.webRequest.onResponseStarted(filter, ({ url, responseHeaders }) => {
    const key = affinityKey(url);
    for (const setCookie of getHeaderValues(responseHeaders, "set-cookie")) {
      const cookie = parseAffinityCookie(setCookie, now());
      if (!cookie) continue;
      if (cookie.value && cookie.expiresAt > now()) {
        cookiesByPool.set(key, cookie);
      } else {
        cookiesByPool.delete(key);
      }
    }
  });

  session.webRequest.onBeforeSendHeaders(filter, ({ url, requestHeaders }, callback) => {
    const key = affinityKey(url);
    const cookie = cookiesByPool.get(key);
    if (!cookie) {
      callback({ requestHeaders });
      return;
    }
    if (cookie.expiresAt <= now()) {
      cookiesByPool.delete(key);
      callback({ requestHeaders });
      return;
    }
    callback({ requestHeaders: withAffinityCookie(requestHeaders, cookie.value) });
  });
}
