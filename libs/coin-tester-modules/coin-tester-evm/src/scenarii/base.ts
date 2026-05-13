import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { resetIndexer, setBlock, indexBlocks, initMswHandlers } from "../indexer";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { makeAccount } from "../fixtures";
import { base, expectAddressInList, getBridges, VITALIK } from "../helpers";
import { killAnvil, spawnAnvil } from "../anvil";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type BaseScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const makeScenarioTransactions = (): BaseScenarioTransaction[] => {
  const scenarioSendBaseTransaction: BaseScenarioTransaction = {
    name: "Send 1 ETH",
    amount: new BigNumber(1e18),
    recipient: VITALIK,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e18).toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, VITALIK);
    },
  };
  const scenarioSendMaxEthTransaction: BaseScenarioTransaction = {
    name: "Send Max ETH",
    useAllAmount: true,
    recipient: VITALIK,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, VITALIK);
    },
  };

  return [scenarioSendBaseTransaction, scenarioSendMaxEthTransaction];
};

export const scenarioBase: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Base Transactions",
  setup: async () => {
    const signer = await buildSigner();

    // 2797222 = deployment block of USDC on Base + 1
    await spawnAnvil("https://mainnet.base.org", signer.exportMnemonic(), 2797222);

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const lastBlockNumber = await provider.getBlockNumber();

    setBlock(lastBlockNumber);

    setCoinConfig(() => ({
      info: {
        status: {
          type: "active",
        },
        node: {
          type: "external",
          uri: "http://127.0.0.1:8545",
        },
        explorer: {
          type: "etherscan",
          noCache: true,
          uri: "https://proxyetherscan.api.live.ledger.com/v2/api/8453",
        },
        showNfts: true,
      },
    }));
    LiveConfig.setConfig({
      config_currency_base: {
        type: "object",
        default: {
          status: {
            type: "active",
          },
          node: {
            type: "external",
            uri: "http://127.0.0.1:8545",
          },
          explorer: {
            type: "etherscan",
            noCache: true,
            uri: "https://proxyetherscan.api.live.ledger.com/v2/api/8453",
          },
          showNfts: true,
        },
      },
    });
    initMswHandlers(getCoinConfig(base.id).info);

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: base,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, base);

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
    };
  },
  getTransactions: () => makeScenarioTransactions(),
  beforeSync: async () => {
    await indexBlocks(base.ethereumLikeInfo?.chainId || 8453);
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
  },
};
