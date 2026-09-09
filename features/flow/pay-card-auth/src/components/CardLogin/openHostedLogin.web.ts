import type { HostedLoginResult } from "../../state/types";

/**
 * The fallback for a web host that hands the flow no `openHostedLogin` of its own. It opens the hosted
 * page in a separate window, which reports nothing back. `ledgerlive://paytab` carries the redirect
 * instead: the app's deep link handler hands the code to the Pay tab, which sends it to the machine.
 * This answers `pending` to say so, and the machine keeps the attempt while it waits.
 *
 * Ledger Live Desktop hands over its own, which opens the page in the Discover webview.
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
