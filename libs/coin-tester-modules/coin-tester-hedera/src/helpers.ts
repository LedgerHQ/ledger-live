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
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { FAKE_HGRAPH_URL, LOCAL_CONSENSUS_NODES, LOCAL_MIRROR_NODE_URL } from "./fixtures";

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
