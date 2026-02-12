import { makeAccount } from "../fixtures";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { killAnvil, spawnAnvil } from "../anvil";
import { VITALIK, core, getBridges } from "../helpers";
import { indexBlocks, initMswHandlers, resetIndexer, setBlock } from "../indexer";
import { STCORE_ON_CORE } from "../tokenFixtures";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-alpaca/types";

type CoreScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const makeScenarioTransactions = ({ address }: { address: string }): CoreScenarioTransaction[] => {
  const scenarioSendCoreTransaction: CoreScenarioTransaction = {
    name: "Send 1 CORE",
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

  // TODO: export when explorer is ready because last token operations come from explorer
  const _scenarioSendSTCORETransaction: CoreScenarioTransaction = {
    name: "Send STCORE",
    amount: new BigNumber(ethers.parseUnits("80", STCORE_ON_CORE.units[0].magnitude).toString()),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:core:${address}:`, STCORE_ON_CORE),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", STCORE_ON_CORE.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.parseUnits("20", STCORE_ON_CORE.units[0].magnitude).toString(),
      );
    },
  };

  const scenarioSendMaxCoreTransaction: CoreScenarioTransaction = {
    name: "Send Max CORE",
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

  return [scenarioSendCoreTransaction, scenarioSendMaxCoreTransaction];
};

export const scenarioCore: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic CORE Transactions",
  setup: async () => {
    const signer = await buildSigner();
    await spawnAnvil("https://rpc.ankr.com/core", signer.exportMnemonic());

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

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
          type: "none",
        },
        showNfts: true,
      },
    }));
    LiveConfig.setConfig({
      config_currency_core: {
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
            type: "none",
          },
          showNfts: false,
        },
      },
    });

    initMswHandlers(getCoinConfig(core).info);

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: core,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, core);

    const lastBlockNumber = await provider.getBlockNumber();
    // Anvil does not produce block if no transactions are sent.
    // This is indeed the case for Core, since we do not top up tokens at the moment.
    setBlock(lastBlockNumber);

    // Get STCORE
    // TODO: uncomment when explorer is ready
    // await callMyDealer({
    //   provider,
    //   drug: STCORE_ON_CORE,
    //   junkie: address,
    //   dose: ethers.parseUnits("100", STCORE_ON_CORE.units[0].magnitude),
    // });

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
    };
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    // TODO: uncomment when explorer is ready
    // expect(account.subAccounts?.[0]?.type).toBe("TokenAccount");
    // expect(account.subAccounts?.[0]?.balance?.toFixed()).toBe(
    //   ethers.parseUnits("100", STCORE_ON_CORE.units[0].magnitude).toString(),
    // );
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  beforeSync: async () => {
    await indexBlocks(core.ethereumLikeInfo?.chainId || 1116);
  },
  afterAll: _account => {
    // TODO: uncomment when explorer is ready
    // expect(account.subAccounts?.length).toBe(1);
    // expect(account.subAccounts?.[0].balance.toFixed()).toBe(
    //   ethers.parseUnits("20", STCORE_ON_CORE.units[0].magnitude).toString(),
    // );
  },
  teardown: async () => {
    resetIndexer();
    await killAnvil();
  },
};
