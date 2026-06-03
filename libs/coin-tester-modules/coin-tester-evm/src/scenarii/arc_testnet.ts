import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { resetIndexer, setBlock, indexBlocks, initMswHandlers } from "../indexer";
import { EvmConfigInfo, getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { makeAccount } from "../fixtures";
import { arcTestnet, expectAddressInList, getBridges, VITALIK } from "../helpers";
import { killAnvil, spawnAnvil } from "../anvil";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";

type ArcTestnetScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const ARC_TESTNET_RPC = "https://rpc.testnet.arc.network";
const ARC_TESTNET_EXPLORER = "https://proxyblockscout.api.live.ledger.com/5042002/api";

// USDC is the chain's native unit on Arc, exposed as ERC20 at this precompile address.
const ARC_USDC_NATIVE_CONTRACT = "0x3600000000000000000000000000000000000000";

function patchCalStoreForArcTestnet(): () => void {
  const store = getCryptoAssetsStore();
  const original = store.getTokensSyncHash.bind(store);
  store.getTokensSyncHash = async (currencyId: string) => {
    if (currencyId === "arc_testnet") return "";
    return original(currencyId);
  };
  return () => {
    store.getTokensSyncHash = original;
  };
}

let restoreCalStore: (() => void) | null = null;

/**
 * Send Arc's native USDC (the chain's base gas token).
 *
 * Uses `nativeContracts: ["0x36…"]` like production. The wallet's filter ensures the ERC20
 * Transfer event the indexer emits on the precompile for native transfers is dropped, so a
 * single native operation appears per transfer (no double-counting).
 *
 * The ERC20 calldata path (`transfer(address,uint256)` on the precompile) isn't covered
 * here because anvil can't emulate Arc's precompile balance semantics.
 */
export const scenarioArcTestnetNative: Scenario<GenericTransaction, Account> = {
  name: "Arc Testnet — send native USDC",
  setup: async () => {
    restoreCalStore = patchCalStoreForArcTestnet();
    const signer = await buildSigner();
    await spawnAnvil(ARC_TESTNET_RPC, signer.exportMnemonic());

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    setBlock(await provider.getBlockNumber());

    const info: EvmConfigInfo = {
      status: { type: "active" },
      node: { type: "external", uri: "http://127.0.0.1:8545" },
      explorer: { type: "blockscout", noCache: true, uri: ARC_TESTNET_EXPLORER },
      showNfts: false,
      nativeContracts: [ARC_USDC_NATIVE_CONTRACT],
    } as EvmConfigInfo;

    setCoinConfig(() => ({ info }));
    LiveConfig.setConfig({
      config_currency_arc_testnet: { type: "object", default: info },
    });
    initMswHandlers(getCoinConfig(arcTestnet.id).info);

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: arcTestnet,
      derivationMode: "",
    });

    return {
      currencyBridge,
      accountBridge,
      account: makeAccount(address, arcTestnet),
    };
  },
  getTransactions: (): ArcTestnetScenarioTransaction[] => [
    {
      name: "Send 1 USDC (native)",
      amount: new BigNumber(1e18),
      recipient: VITALIK,
      expect: (previousAccount, currentAccount) => {
        const [latestOperation] = currentAccount.operations;
        expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
        expect(latestOperation.type).toBe("OUT");
        expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e18).toFixed());
        // No sub-op for the ERC20 mirror — the filter dropped it.
        expect(latestOperation.subOperations ?? []).toEqual([]);
        expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
        expectAddressInList(latestOperation.recipients, VITALIK);
      },
    },
    {
      name: "Send Max USDC (native)",
      useAllAmount: true,
      recipient: VITALIK,
      expect: (previousAccount, currentAccount) => {
        const [latestOperation] = currentAccount.operations;
        expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
        expect(latestOperation.type).toBe("OUT");
        expect(currentAccount.balance.toFixed()).toBe(
          previousAccount.balance.minus(latestOperation.value).toFixed(),
        );
      },
    },
  ],
  beforeSync: async () => {
    await indexBlocks(arcTestnet.ethereumLikeInfo?.chainId || 5042002);
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
  },
  afterAll: account => {
    expect(account.operations.length).toBe(2);
  },
  teardown: async () => {
    await killAnvil();
    resetIndexer();
    restoreCalStore?.();
    restoreCalStore = null;
  },
};
