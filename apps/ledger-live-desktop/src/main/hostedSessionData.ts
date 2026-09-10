import type { Cookie, Session } from "electron";

const LEDGER_OWN_DOMAIN = "ledger.com";

const CLEARED_STORAGES = ["localstorage", "indexdb", "serviceworkers", "cachestorage"] as const;

const ALLOWED_ORIGIN_PROTOCOLS = new Set(["http:", "https:"]);

function withoutLeadingDot(cookieDomain: string): string {
  return cookieDomain.startsWith(".") ? cookieDomain.slice(1) : cookieDomain;
}

export function isProviderCookieForHost(cookieDomain: string, host: string): boolean {
  const domain = withoutLeadingDot(cookieDomain);

  if (domain === LEDGER_OWN_DOMAIN || host === LEDGER_OWN_DOMAIN) {
    return false;
  }

  if (domain === host || domain.endsWith(`.${host}`)) {
    return true;
  }

  const isParentOfHost = host.endsWith(`.${domain}`);

  return isParentOfHost && !domain.endsWith(`.${LEDGER_OWN_DOMAIN}`);
}

function cookieUrl(cookie: Cookie): string {
  const host = withoutLeadingDot(cookie.domain ?? "");
  const scheme = cookie.secure ? "https" : "http";

  return `${scheme}://${host}${cookie.path ?? "/"}`;
}

function readOrigins(origins: unknown): URL[] {
  if (!Array.isArray(origins)) {
    return [];
  }

  return origins.flatMap(origin => {
    if (typeof origin !== "string" || origin === "") {
      return [];
    }

    try {
      const url = new URL(origin);
      // This comes over IPC. Restricting it to http/https keeps a compromised renderer from
      // aiming a storage wipe at a scheme clearStorageData was never meant to reach.
      return ALLOWED_ORIGIN_PROTOCOLS.has(url.protocol) ? [url] : [];
    } catch {
      return [];
    }
  });
}

export async function clearHostedSessionData(
  targetSession: Session,
  origins: unknown,
): Promise<void> {
  for (const { origin, hostname } of readOrigins(origins)) {
    // Best effort, like the removal below: a store that refuses to answer must not skip this
    // origin's storage wipe, nor abort the wipe of every origin still left in the list.
    const stored = await targetSession.cookies.get({ domain: hostname }).catch(() => []);

    await Promise.allSettled(
      stored
        .filter(cookie => isProviderCookieForHost(cookie.domain ?? "", hostname))
        .map(cookie => targetSession.cookies.remove(cookieUrl(cookie), cookie.name)),
    );

    // Best effort too: a wipe that fails for one origin must not skip the origins still left.
    await targetSession
      .clearStorageData({
        origin,
        storages: [...CLEARED_STORAGES],
      })
      .catch(() => undefined);
  }
}
