export const MESH_PAY_POPUP_HOSTS = [
  "sandbox-web.meshconnect.com",
  "sandbox.meshconnect.com",
  "meshconnect.com",
  "coinbase.com",
] as const;

/** OAuth providers that refuse iframe embedding and must open as popups. */
export const MESH_PAY_OAUTH_FRAME_HOSTS = [
  "coinbase.com",
  "login.coinbase.com",
  "accounts.coinbase.com",
  "www.coinbase.com",
] as const;

function hostnameMatchesAllowedHost(hostname: string, host: string) {
  return hostname === host || hostname.endsWith(`.${host}`);
}

export function isMeshPayPopupUrl(url: string) {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;

    return MESH_PAY_POPUP_HOSTS.some(host => hostnameMatchesAllowedHost(hostname, host));
  } catch {
    return false;
  }
}

export function isMeshPayOAuthFrameUrl(url: string) {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;

    return MESH_PAY_OAUTH_FRAME_HOSTS.some(host => hostnameMatchesAllowedHost(hostname, host));
  } catch {
    return false;
  }
}

export function isMeshConnectUrl(url: string) {
  return /meshconnect\.com/.test(url);
}

export function stripMeshEmbedRestrictions(
  responseHeaders: Record<string, string[]> | undefined,
): Record<string, string[]> {
  const headers: Record<string, string[]> = { ...(responseHeaders ?? {}) };

  for (const key of Object.keys(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "x-frame-options") {
      delete headers[key];
    } else if (lowerKey === "content-security-policy") {
      headers[key] = headers[key].map(value => value.replace(/frame-ancestors[^;]*;?/gi, ""));
    }
  }

  return headers;
}
