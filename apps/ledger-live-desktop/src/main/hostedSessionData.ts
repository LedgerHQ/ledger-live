import type { Cookie, Session } from "electron";

const LEDGER_OWN_DOMAIN = "ledger.com";

const CLEARED_STORAGES = ["localstorage", "indexdb", "serviceworkers", "cachestorage"] as const;

function withoutLeadingDot(cookieDomain: string): string {
  return cookieDomain.startsWith(".") ? cookieDomain.slice(1) : cookieDomain;
}

export function isProviderCookieForHost(cookieDomain: string, host: string): boolean {
  const domain = withoutLeadingDot(cookieDomain);

  if (domain === host || domain.endsWith(`.${host}`)) {
    return true;
  }

  const isParentOfHost = host.endsWith(`.${domain}`);

  return (
    isParentOfHost && domain !== LEDGER_OWN_DOMAIN && !domain.endsWith(`.${LEDGER_OWN_DOMAIN}`)
  );
}

function cookieUrl(cookie: Cookie): string {
  const host = withoutLeadingDot(cookie.domain ?? "");
  const scheme = cookie.secure ? "https" : "http";

  return `${scheme}://${host}${cookie.path ?? "/"}`;
}

function readHosts(hosts: unknown): string[] {
  if (!Array.isArray(hosts)) {
    return [];
  }

  return hosts.filter((host): host is string => typeof host === "string" && host !== "");
}

export async function clearHostedSessionData(
  targetSession: Session,
  hosts: unknown,
): Promise<void> {
  for (const host of readHosts(hosts)) {
    const stored = await targetSession.cookies.get({ domain: host });

    await Promise.all(
      stored
        .filter(cookie => isProviderCookieForHost(cookie.domain ?? "", host))
        .map(cookie => targetSession.cookies.remove(cookieUrl(cookie), cookie.name)),
    );

    await targetSession.clearStorageData({
      origin: `https://${host}`,
      storages: [...CLEARED_STORAGES],
    });
  }
}
