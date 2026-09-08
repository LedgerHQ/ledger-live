import type { HostedLoginResult } from "../../state/types";

/**
 * Desktop opens the hosted page in a separate window, which reports nothing back. `ledgerlive://paytab`
 * carries the redirect instead: the app's deep link handler hands the code to the Pay tab, which sends
 * it to the machine. This answers `pending` to say so, and the machine keeps the attempt while it
 * waits.
 *
 * Opening the page in an isolated Discover dapp WebView is the end of this work (LIVE-34740). It waits
 * on the Baanx manifest, and the flow above it does not change when the window does.
 *
 * `noopener` keeps the hosted page away from `window.opener`, and it also makes `window.open` answer
 * `null` every time, by specification. The answer therefore says nothing about the new context, so a
 * test of it would report a failure for every login. A throw still reaches the machine, which reports
 * `browser_open_failed`.
 */
export async function openHostedLoginInBrowser(loginUrl: string): Promise<HostedLoginResult> {
  window.open(loginUrl, "_blank", "noopener,noreferrer");

  return { type: "pending" };
}
