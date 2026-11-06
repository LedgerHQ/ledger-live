import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { spawnSandbox } from "./sandbox";
import { makeGenericAdapterAccount } from "./fixtures";
import { buildGenericSigner } from "./signer";
import { getBitcoinGenericBridges } from "./genericBridges";
import type { BitcoinGenericTransaction } from "./genericBridges";

// The account's single address: first native SegWit receive address on regtest (coin type 1).
const ADDRESS_PATH = "84'/1'/0'/0/0";

/** Starts the regtest sandbox and builds the generic-adapter account and bridges on it. */
export async function setupGenericAccount(): Promise<{
  sandbox: Sandbox;
  account: Account;
  address: string;
  accountBridge: AccountBridge<BitcoinGenericTransaction>;
  currencyBridge: CurrencyBridge;
}> {
  const { sandbox, explorerUrl } = await spawnSandbox();

  const coinConfig: BitcoinCoinConfig = {
    status: { type: "active" },
    name: "Bitcoin Regtest",
    unit: { name: "bitcoin", code: "𝚝BTC", magnitude: 8 },
    explorerId: "btc_regtest",
    explorer: { url: explorerUrl },
    // As Ledger Live configures regtest: app-bitcoin-new's version 2, RBF-signalling inputs.
    transaction: { version: 2, signalsRbf: true },
  };
  LiveConfig.setConfig({
    config_currency_bitcoin_regtest: { type: "object", default: coinConfig },
  });

  const signer = await buildGenericSigner();
  const { address, publicKey } = await signer.getAddress(ADDRESS_PATH);
  const { accountBridge, currencyBridge } = await getBitcoinGenericBridges(signer);
  const account = makeGenericAdapterAccount(
    address,
    publicKey,
    ADDRESS_PATH,
    getCryptoCurrencyById("bitcoin_regtest"),
  );
  return { sandbox, account, address, accountBridge, currencyBridge };
}
