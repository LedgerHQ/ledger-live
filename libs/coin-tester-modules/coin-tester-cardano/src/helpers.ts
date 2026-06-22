import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { executeScenario, type Scenario } from "@ledgerhq/coin-tester/main";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import type {
  CoinFrameworkSigner,
  GenericTransaction,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account } from "@ledgerhq/types-live";
import { buildSigner, type CardanoTesterSigner } from "./signer";

registerCoinModules(coinModuleLoaders);

// The generic framework resolves coin-module loaders (validateAddress, setup, account, …) by the
// *network* string as a family key. `cardano_testnet` (the Yaci devnet currency) shares the cardano
// implementation, so alias it to the cardano loader — otherwise getValidateAddress("cardano_testnet")
// throws "No validate address function". Tester-local; no framework change.
const cardanoLoader = coinModuleLoaders.find(m => m.family === "cardano");
if (cardanoLoader) registerCoinModules([{ ...cardanoLoader, family: "cardano_testnet" }]);

export const cardano = getCryptoCurrencyById("cardano");

// Run a scenario, swallowing executeScenario's "done" sentinel; on a real failure run `onError`
// (e.g. tear down the devnet) before rethrowing.
// generic-adapter only: Cardano's legacy bridge isn't wired into the coin-tester.
export async function safeExecuteScenario(
  scenario: Scenario<GenericTransaction, Account>,
  onError?: () => Promise<void>,
): Promise<void> {
  try {
    await executeScenario(scenario, "generic-adapter");
  } catch (e) {
    if (e !== "done") {
      await onError?.();
      throw e;
    }
  }
}

// Which Cardano network the bridges target. Mainnet (network tag 1, addr1…, CARDANO_API_ENDPOINT) is
// the default for the in-memory mock scenarios; testnet (tag 0, addr_test…, CARDANO_TESTNET_API_ENDPOINT)
// is used by the Yaci-devnet send scenario.
export type CardanoNet = { network: "cardano" | "cardano_testnet"; networkId: number };
export const MAINNET: CardanoNet = { network: "cardano", networkId: 1 };
export const TESTNET: CardanoNet = { network: "cardano_testnet", networkId: 0 };

// What genericSignOperation invokes through the SignerContext: getAddress → publicKey for the
// vkey witness, signTransaction → the 64-byte signature over the tx body.
type InnerSigner = {
  getAddress: (path: string) => Promise<{ publicKey: string }>;
  signTransaction: (path: string, unsignedTxHex: string) => Promise<string>;
};

export async function getBridges(customSignerArg?: CardanoTesterSigner, net: CardanoNet = MAINNET) {
  const signer = customSignerArg ?? (await buildSigner());
  const inner: InnerSigner = {
    getAddress: async path => ({
      publicKey: (await signer.getAddress(path, net.networkId)).publicKey,
    }),
    signTransaction: (path, unsignedTxHex) => signer.signTransaction(path, unsignedTxHex),
  };

  const context: SignerContext<InnerSigner> = (_deviceId, fn) => fn(inner);

  const getAddress: GetAddressFn = async (_deviceId, { path }) => {
    const { address, publicKey } = await signer.getAddress(path, net.networkId);
    return { address, publicKey, path };
  };

  const customSigner: CoinFrameworkSigner<InnerSigner> = { getAddress, context };

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge(net.network, "local", customSigner),
    accountBridge: await getCoinFrameworkAccountBridge(net.network, "local", customSigner),
    getAddress,
  };
}
