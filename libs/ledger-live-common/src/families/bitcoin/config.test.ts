import type { BitcoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { perCoinLogic } from "@ledgerhq/coin-bitcoin/logic";
import type { Transaction } from "@ledgerhq/coin-bitcoin/types";
import { bitcoinConfig } from "./config";

/**
 * The transaction formats of the coin config, read by coin-bitcoin's coin module API, must state
 * what the legacy bridge builds for the same currency: the bridge keeps these facts in code
 * (`perCoinLogic`, `buildTransaction.ts`, `signOperation.ts`, hw-app-btc), the API in this config.
 */

// Currencies the coin module API serves.
const CURRENCIES = [
  "bitcoin",
  "bitcoin_testnet",
  "bitcoin_regtest",
  "bitcoin_cash",
  "bitcoin_gold",
  "dash",
  "decred",
  "digibyte",
  "dogecoin",
  "komodo",
  "litecoin",
  "qtum",
];

// coin-bitcoin `buildTransaction.ts`: the currencies whose transactions signal replace-by-fee.
const RBF = ["bitcoin", "bitcoin_testnet", "bitcoin_regtest"];
// hw-app-btc `Btc.ts`: the currencies signed by app-bitcoin-new, which builds version 2 transactions.
const APP_BITCOIN_NEW = ["bitcoin", "bitcoin_testnet", "bitcoin_regtest", "qtum"];

const defaultsOf = (currencyId: string) =>
  bitcoinConfig[`config_currency_${currencyId}`].default as Partial<BitcoinConfig>;

describe("bitcoin coin config", () => {
  it.each(CURRENCIES)("states the transaction format the bridge builds for %s", currencyId => {
    const { transaction, addressFormat } = defaultsOf(currencyId);
    const bridge = perCoinLogic[currencyId];

    expect({
      version: transaction?.version ?? 1,
      signalsRbf: transaction?.signalsRbf ?? false,
      expiryHeight: transaction?.expiryHeight ?? false,
      extraData: transaction?.extraData ?? false,
      // coin-bitcoin `signOperation.ts`: Komodo's locktime is 777 s before signing.
      interestLockTime: transaction?.interestLockTime ?? false,
      additionals: transaction?.additionals ?? [],
      cashaddr: addressFormat === "cashaddr",
    }).toEqual({
      version: APP_BITCOIN_NEW.includes(currencyId) ? 2 : 1,
      signalsRbf: RBF.includes(currencyId),
      expiryHeight: bridge?.hasExpiryHeight ?? false,
      extraData: bridge?.hasExtraData ?? false,
      interestLockTime: currencyId === "komodo",
      // A recipient in legacy format: Bitcoin Cash's `cashaddr` flag follows addressFormat.
      additionals:
        bridge?.getAdditionals?.({ transaction: { recipient: "" } as Transaction }) ?? [],
      cashaddr: bridge?.asExplicitTransactionRecipient !== undefined,
    });
  });
});
