import { makeAccount } from "../fixtures";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { killAnvil, spawnAnvil } from "../anvil";
import { VITALIK, robinhoodTestnet, expectAddressInList, getBridges } from "../helpers";
import { initMswHandlers, resetIndexer } from "../indexer";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type RobinhoodTestnetScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const ROBINHOOD_TESTNET_RPC = "https://rpc.testnet.chain.robinhood.com";

export const scenarioRobinhoodTestnet: Scenario<GenericTransaction, Account> = {
  name: "Robinhood Testnet — send native ETH",
  setup: async () => {
    const signer = await buildSigner();
    await spawnAnvil(ROBINHOOD_TESTNET_RPC, signer.exportMnemonic());

    setCoinConfig(() => ({
      info: {
        status: { type: "active" },
        node: { type: "external", uri: "http://127.0.0.1:8545" },
        explorer: { type: "none" },
        showNfts: false,
      },
    }));
    LiveConfig.setConfig({
      config_currency_robinhood_testnet: {
        type: "object",
        default: {
          status: { type: "active" },
          node: { type: "external", uri: "http://127.0.0.1:8545" },
          explorer: { type: "none" },
          showNfts: false,
        },
      },
    });

    initMswHandlers(getCoinConfig(robinhoodTestnet.id).info);

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: robinhoodTestnet,
      derivationMode: "",
    });

    return {
      currencyBridge,
      accountBridge,
      account: makeAccount(address, robinhoodTestnet),
    };
  },
  getTransactions: (): RobinhoodTestnetScenarioTransaction[] => [
    {
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
    },
    {
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
    },
  ],
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
  },
  afterAll: account => {
    expect(account.operations.length).toBe(2);
  },
  teardown: async () => {
    resetIndexer();
    await killAnvil();
  },
};
