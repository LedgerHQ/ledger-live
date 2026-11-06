import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import resolver from "@ledgerhq/live-common/families/evm/getAddress";
import type { Signer } from "@ledgerhq/live-common/families/evm/signer";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";

registerCoinModules(coinModuleLoaders);

export const ethereum = getCryptoCurrencyById("ethereum");
export const core = getCryptoCurrencyById("core");
export const sonic = getCryptoCurrencyById("sonic");
export const polygon = getCryptoCurrencyById("polygon");
export const scroll = getCryptoCurrencyById("scroll");
export const optimism = getCryptoCurrencyById("optimism");
export const bnb = getCryptoCurrencyById("bsc");
export const base = getCryptoCurrencyById("base");
export const arc = getCryptoCurrencyById("arc");
export const robinhood = getCryptoCurrencyById("robinhood");
export const VITALIK = "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9";

/** Asserts that an address appears in a list (case-insensitive, for EIP-55 robustness). Skips when list is missing or empty. */
export function expectAddressInList(list: string[] | undefined, address: string): void {
  if (!list || list.length === 0) return;
  const normalizedAddress = address?.toLowerCase() ?? "";
  const found = list.some(a => (a ?? "").toLowerCase() === normalizedAddress);
  expect(found).toBe(true);
}

export async function getBridges(signer: Signer): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const context: SignerContext<Signer> = (_, fn) => fn(signer);
  const getAddress = resolver(context);

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("evm", "local", { context, getAddress }),
    accountBridge: await getCoinFrameworkAccountBridge("evm", "local", { context, getAddress }),
    getAddress,
  };
}
