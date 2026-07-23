import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-hedera/bridge/index";
import type { HederaCoinConfig } from "@ledgerhq/coin-hedera/config";
import hederaResolver from "@ledgerhq/coin-hedera/signer/index";
import type {
  Transaction,
  TransactionStatus,
  HederaAccount,
  HederaSigner,
} from "@ledgerhq/coin-hedera/types";
import type { ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import {
  FAKE_HGRAPH_URL,
  HEDERA,
  LOCAL_CONSENSUS_NODES,
  LOCAL_MIRROR_NODE_URL,
  installCryptoAssetsStore,
} from "./fixtures";
import { buildHederaSigner } from "./signer";
import { createFundedAccount } from "./genesis";
import { initMswHandlers } from "./indexer";

/** Every scenario account starts funded with this many HBAR from the genesis operator. */
const INITIAL_BALANCE_HBAR = 100;

export type HederaScenarioTransaction = ScenarioTransaction<Transaction, HederaAccount>;

registerCoinModules(coinModuleLoaders);

// `networkType: "testnet"` is a label only — `consensusNodes` and `apiUrls` override the actual endpoints.
export function buildLocalHederaConfig(): HederaCoinConfig {
  return {
    status: { type: "active" },
    useNetworkTimestamp: false,
    networkType: "testnet",
    consensusNodes: LOCAL_CONSENSUS_NODES,
    apiUrls: {
      mirrorNode: LOCAL_MIRROR_NODE_URL,
      hgraph: FAKE_HGRAPH_URL,
    },
  };
}

export async function getBridges(signer: HederaSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction, HederaAccount, TransactionStatus>;
  getAddress: GetAddressFn;
}> {
  const signerContext: SignerContext<HederaSigner> = (_deviceId, fn) => fn(signer);
  const localConfig = buildLocalHederaConfig();

  const { currencyBridge, accountBridge } = createBridges(signerContext, () => localConfig);
  const getAddress = hederaResolver(signerContext);

  return { currencyBridge, accountBridge, getAddress };
}

/**
 * Shared scenario preamble: installs the crypto-assets store (unskippable — `tokens` is required,
 * so a scenario can never forget it and silently inherit whatever the previous scenario left
 * installed), builds a fresh signer and bridges, derives the account-under-test's address, starts
 * the MSW handlers, and funds the account from the genesis operator.
 */
export async function setupHederaScenario(tokens: TokenCurrency[]): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction, HederaAccount, TransactionStatus>;
  publicKey: string;
  accountId: string;
  close: () => void;
}> {
  installCryptoAssetsStore(tokens);

  const signer = buildHederaSigner();
  const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);

  const { publicKey } = await getAddress("", {
    path: "44/3030",
    currency: HEDERA,
    derivationMode: "hederaBip44",
  });

  const close = initMswHandlers();

  const accountId = await createFundedAccount(publicKey, INITIAL_BALANCE_HBAR);

  return { currencyBridge, accountBridge, publicKey, accountId, close };
}
