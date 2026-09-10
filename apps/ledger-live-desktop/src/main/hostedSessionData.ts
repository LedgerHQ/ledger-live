import type { Cookie, Session } from "electron";

const LEDGER_OWN_DOMAIN = "ledger.com";

const CLEARED_STORAGES = ["localstorage", "indexdb", "serviceworkers", "cachestorage"] as const;

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
      return [new URL(origin)];
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

    await targetSession.clearStorageData({
      origin,
      storages: [...CLEARED_STORAGES],
    });
  }
}
