import type { HostedLoginResult } from "../../state/types";

/**
 * Desktop opens the hosted page in the user's own browser, which reports nothing back. The custom
 * protocol carries the redirect on desktop, and reading it is later work (LIVE-34740), so this
 * answers `dismissed`: the page is open, and the login screen goes back to offering the action.
 */
export async function openHostedLoginInBrowser(loginUrl: string): Promise<HostedLoginResult> {
  const opened = window.open(loginUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    throw new Error("Unable to start login");
  }

  return { type: "dismissed" };
}
