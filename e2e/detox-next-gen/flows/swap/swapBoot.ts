/**
 * Swap setup: derive the on-device addresses a swap needs, one coin app at a
 * time. Lives in the flow layer (not helpers/) because it knows about Accounts
 * and the live-common CLI — domain coupling helpers/ deliberately avoids. It
 * composes helpers/{session,speculos}; it never imports pages or the swap
 * runner/flow, so the import graph stays acyclic.
 */
import { startSession } from "../../helpers/session";
import { launchSpeculos, shutdownSpeculos } from "../../helpers/speculos";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";

/** A valid app key for `launchSpeculos`/`startSession` (one of the `specs` keys). */
export type SpeculosApp = Parameters<typeof launchSpeculos>[0];

/**
 * Derive each account's receive address on its own coin app and populate the
 * Account singletons. getAddress talks to whichever Speculos is currently
 * registered, so accounts are grouped by coin app and one app is booted at a
 * time: the first boot also launches the app + loads `userdata` (startSession),
 * the rest only swap the Speculos device. Each app is shut down before the next
 * (the per-group boot is wrapped in try/finally so a derive failure never leaks
 * a Speculos), so on return NO Speculos is running — the caller boots Exchange next.
 *
 * The output is a side effect: every account's `.address` is set (via
 * `liveDataWithAddressCommand`); the function returns nothing.
 */
export async function deriveSwapAddresses(
  accounts: Account[],
  userdata = "device-ready",
): Promise<void> {
  const appNames = [...new Set(accounts.map(a => a.currency.speculosApp.name))];
  let first = true;
  for (const appName of appNames) {
    const handle = first
      ? await startSession({ userdata, speculosApp: appName as SpeculosApp })
      : await launchSpeculos(appName as SpeculosApp);
    try {
      for (const account of accounts.filter(a => a.currency.speculosApp.name === appName)) {
        await liveDataWithAddressCommand(account)();
      }
    } finally {
      await shutdownSpeculos(handle);
    }
    first = false;
  }
}
