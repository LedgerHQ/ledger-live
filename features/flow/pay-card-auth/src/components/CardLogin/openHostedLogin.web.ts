import type { HostedLoginResult } from "../../state/types";

/**
 * The window reports nothing back, so `ledgerlive://paytab` carries the redirect and the answer is
 * `pending`. `noopener` makes `window.open` answer `null` by specification, so nothing reads it.
 */
export async function openHostedLoginInBrowser(loginUrl: string): Promise<HostedLoginResult> {
  window.open(loginUrl, "_blank", "noopener,noreferrer");

  return { type: "pending" };
}
