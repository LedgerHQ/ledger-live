import type { HostedLoginResult } from "../../state/types";

/**
 * Desktop opens the hosted page in the user's own browser, which reports nothing back. The custom
 * protocol carries the redirect on desktop, and reading it is later work (LIVE-34740), so this
 * answers `dismissed`: the page is open, and the login screen goes back to offering the action.
 *
 * `noopener` keeps the hosted page away from `window.opener`, and it also makes `window.open` answer
 * `null` every time, by specification. The answer therefore says nothing about the new context, so a
 * test of it reports a failure for every login. A platform that refuses the window reads as a
 * dismissal instead, and the login screen offers the action again. A throw still reaches the machine,
 * which reports `browser_open_failed`.
 */
export async function openHostedLoginInBrowser(loginUrl: string): Promise<HostedLoginResult> {
  window.open(loginUrl, "_blank", "noopener,noreferrer");

  return { type: "dismissed" };
}
