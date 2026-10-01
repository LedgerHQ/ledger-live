import "./live-common-setup-network";
import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { buildCryptoAssetsStore } from "@features/platform-currencies";
import { store } from "./store";
import {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { setRateLookup as setWalletPnlRateLookup } from "@ledgerhq/wallet-pnl";
import {
  calculate,
  historyKey,
  inferCurrencyAPIID,
  type CounterValuesState,
} from "@domain/entity-market-countervalues";

// The domain registry is the runtime source of truth for currency data.
setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});

LiveConfig.setConfig(liveConfig);
LiveConfig.setAppinfo({
  platform: "web",
});

setWalletAPIVersion(WALLET_API_VERSION);

// Register every coin module (and its signer) so the tools have exactly the
// same coin support as Ledger Live Desktop. Without this, account flows fail
// with "No coin module registered for family ..." / "No signer registered ...".
registerAllCoins();

export function setupCryptoAssetsStore(): void {
  setCryptoAssetsStore(buildCryptoAssetsStore({ dispatch: store.dispatch }));
}

/**
 * Fill the countervalues interface that `@ledgerhq/wallet-pnl` declares. It treats the
 * state as opaque, so the casts back to a concrete state belong here, at the
 * composition root. The pnl-calculator pages throw without this.
 */
export function setupRateLookups(): void {
  setWalletPnlRateLookup({
    calculate: (snapshot, query) => calculate(snapshot as CounterValuesState, query),
    historyKey: (snapshot, from, to, lastOpDate) =>
      historyKey(snapshot as CounterValuesState, from, to, lastOpDate),
    currencyApiId: inferCurrencyAPIID,
  });
}

setupCryptoAssetsStore();
setupRateLookups();
