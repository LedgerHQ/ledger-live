import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { resetIndexer, setBlock, indexBlocks, initMswHandlers } from "../indexer";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { makeAccount } from "../fixtures";
import { callMyDealer, getBridges, bnb, VITALIK } from "../helpers";
import { killAnvil, spawnAnvil } from "../anvil";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { USDT_ON_BNB } from "../tokenFixtures";
import { buildSigner } from "../signer";

type BnbScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

const makeScenarioTransactions = ({ address }: { address: string }): BnbScenarioTransaction[] => {
  const scenarioSendBNBTransaction: BnbScenarioTransaction = {
    name: "Send 1 BNB",
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
    },
  };

  const scenarioSendUSDTTransaction: BnbScenarioTransaction = {
    name: "Send USDT",
    amount: new BigNumber(ethers.parseUnits("80", USDT_ON_BNB.units[0].magnitude).toString()),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:bsc:${address}:`, USDT_ON_BNB),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", USDT_ON_BNB.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.parseUnits("20", USDT_ON_BNB.units[0].magnitude).toString(),
      );
    },
  };

  const scenarioSendMaxBNBTransaction: BnbScenarioTransaction = {
    name: "Send Max BNB",
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
  };

  return [scenarioSendBNBTransaction, scenarioSendUSDTTransaction, scenarioSendMaxBNBTransaction];
};

export const scenarioBnb: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic BNB Transactions",
  setup: async () => {
    const signer = await buildSigner();
    await spawnAnvil("https://bsc-rpc.publicnode.com", signer.exportMnemonic());

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    setBlock(lastBlockNumber + 1);

    setCoinConfig(() => ({
      info: {
        status: {
          type: "active",
        },
        gasTracker: {
          type: "ledger",
          explorerId: "bnb",
        },
        node: {
          type: "external",
          uri: "http://127.0.0.1:8545",
        },
        explorer: {
          type: "ledger",
          explorerId: "bnb",
        },
        showNfts: true,
      },
    }));
    LiveConfig.setConfig({
      config_currency_bsc: {
        type: "object",
        default: {
          status: {
            type: "active",
          },
          gasTracker: {
            type: "ledger",
            explorerId: "bnb",
          },
          node: {
            type: "external",
            uri: "http://127.0.0.1:8545",
          },
          explorer: {
            type: "ledger",
            explorerId: "bnb",
          },
          showNfts: true,
        },
      },
    });
    initMswHandlers(getCoinConfig(bnb).info);
    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);

    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: bnb,
      derivationMode: "",
    });
    const scenarioAccount = makeAccount(address, bnb);

    await callMyDealer({
      provider,
      drug: USDT_ON_BNB,
      junkie: address,
      dose: ethers.parseUnits("100", USDT_ON_BNB.units[0].magnitude),
    });

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
    };
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  beforeSync: async () => {
    await indexBlocks(bnb.ethereumLikeInfo?.chainId || 56);
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    expect(account.subAccounts?.[0]?.type).toBe("TokenAccount");
    expect(account.subAccounts?.[0]?.balance?.toFixed()).toBe(
      ethers.parseUnits("100", USDT_ON_BNB.units[0].magnitude).toString(),
    );
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("20", USDT_ON_BNB.units[0].magnitude).toString(),
    );
    expect(account.operations.length).toBe(4);
  },
  teardown: async () => {
    await killAnvil();
    resetIndexer();
  },
};
