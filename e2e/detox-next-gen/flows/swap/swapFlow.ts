/**
 * Reusable swap-form flow helpers — the cross-page interactions shared by the
 * CEX runner (./swap.ts) and the DEX spec. Mirrors e2e/mobile's
 * utils/swapUtils.ts: these drive the swap webview + native modular drawer but
 * register no tests. They live here (not on a page object) because they span
 * two screens — a page method would force page→page delegation, which this
 * suite avoids, and the modular drawer takes plain strings, not Accounts.
 */
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { app } from "../../pages";

/**
 * The modular drawer's network id for an account: the parent chain's name for
 * a token (USDT → "ethereum"), else the coin's own app name. Lowercased — the
 * drawer matches `network-item-<id>` case-insensitively. Only consulted when
 * the drawer actually shows a network step (see {@link selectSwapCurrency}).
 */
function networkIdFor(account: AccountType): string {
  const base = account.parentAccount
    ? account.parentAccount.currency.name
    : account.currency.speculosApp.name;
  return base.toLowerCase();
}

/**
 * Select the "from" or "to" currency in the swap form. No-op when the selector
 * already shows the ticker (the form often defaults one side) — mirrors
 * e2e/mobile's `selectCurrency` early-return. The drawer may insert a network
 * step before accounts depending on the asset's swappable networks (e.g. ETH
 * and USDT show one, BTC/SOL don't); that's detected at runtime by
 * `selectNetworkIfAsked`, so callers don't track which assets have one.
 */
export async function selectSwapCurrency(side: "from" | "to", account: AccountType): Promise<void> {
  const { currency } = account;
  const alreadyShown =
    side === "from"
      ? await app.swapLiveApp.fromShows(currency.ticker)
      : await app.swapLiveApp.toShows(currency.ticker);
  if (alreadyShown) return;

  if (side === "from") await app.swapLiveApp.tapFromSelector();
  else await app.swapLiveApp.tapToSelector();

  const accountName = getParentAccountName(account);
  await app.modularDrawer.chooseAsset(currency.ticker, currency.name);
  await app.modularDrawer.selectNetworkIfAsked(networkIdFor(account), accountName);
  await app.modularDrawer.selectAccount(accountName);
}

/**
 * Drive the swap form from currency selection through quote request: pick
 * from + to, input `amount`, read the (possibly reformatted) displayed amount
 * back, and tap "Get quotes". Does NOT open the deeplink — the caller controls
 * that (CEX opens it in beforeAll, the DEX spec opens it in the test body).
 * Returns the displayed from-amount (falling back to `amount`) so the caller
 * can keep `swap.amount` aligned with what the device will show.
 */
export async function performSwapUntilQuotes(
  from: AccountType,
  to: AccountType,
  amount: string,
): Promise<string> {
  await selectSwapCurrency("from", from);
  await selectSwapCurrency("to", to);
  await app.swapLiveApp.inputAmount(amount);
  const displayed = await app.swapLiveApp.getSendAmount();
  await app.swapLiveApp.getQuotes();
  return displayed || amount;
}

/**
 * Wait for quotes to render, then return the first of `candidates` that has a
 * quote card (priority = array order), or undefined if none quoted this pair.
 * Composes the swap-webview page primitives; the acceptable-provider policy
 * (which list, in what order) stays with the caller.
 */
export async function firstQuotedProvider(
  candidates: SwapProvider[],
): Promise<SwapProvider | undefined> {
  await app.swapLiveApp.waitForAnyQuote();
  for (const candidate of candidates) {
    if (await app.swapLiveApp.hasProvider(candidate.name)) return candidate;
  }
  return undefined;
}
