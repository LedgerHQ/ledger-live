const ALLOWED_PROTOCOLS = ["http:", "https:", "ledgerlive:", "ledgerwallet:"];

/**
 * Validates that a URL uses a safe protocol (http or https only) or LW deeplink protocols.
 * This prevents RCE attacks via dangerous protocols like file://, smb://, etc.
 * @see https://www.electronjs.org/docs/latest/tutorial/security#15-do-not-use-openexternal-with-untrusted-content
 */
export const isUrlSafe = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};
