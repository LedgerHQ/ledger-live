import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { makeAccount } from "../fixtures";
import {
  alpenTestnet,
  expectAddressInList,
  expectLegacyTransaction,
  getBridges,
  VITALIK,
} from "../helpers";
import { indexBlocks, initMswHandlers, resetIndexer, setBlock } from "../indexer";
import { killAnvil, spawnAnvil } from "../anvil";
import { buildSigner } from "../signer";

type AlpenTestnetScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const ALPEN_TESTNET_RPC = "https://alpen.testnet.alpen.org";
const ALPEN_TESTNET_EXPLORER = "https://explorer.testnet.alpen.org/api";
const ALPEN_TESTNET_CHAIN_ID = 20310;
// Same floor as the production configuration: transactions are sent as legacy with this gas price floor
const ALPEN_TESTNET_MIN_GAS_PRICE = "2000000";

export const scenarioAlpenTestnet: Scenario<GenericTransaction, Account> = {
  name: "Alpen Testnet — send native BTC",
  setup: async () => {
    const signer = await buildSigner();
    await spawnAnvil(ALPEN_TESTNET_RPC, signer.exportMnemonic());

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    setBlock(await provider.getBlockNumber());

    const info: EvmConfigInfo = {
      status: { type: "active" },
      chainId: ALPEN_TESTNET_CHAIN_ID,
      name: "Alpen Testnet",
      unit: { name: "BTC", code: "BTC", magnitude: 18 },
      node: { type: "external", uri: "http://127.0.0.1:8545" },
      explorer: { type: "blockscout", noCache: true, uri: ALPEN_TESTNET_EXPLORER },
      forceLegacyTransactions: true,
      minGasPrice: ALPEN_TESTNET_MIN_GAS_PRICE,
    };
    LiveConfig.setConfig({ config_currency_alpen_testnet: { type: "object", default: info } });
    initMswHandlers(info);

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: alpenTestnet,
      derivationMode: "",
    });

    return { currencyBridge, accountBridge, account: makeAccount(address, alpenTestnet) };
  },
  getTransactions: (): AlpenTestnetScenarioTransaction[] => [
    {
      name: "Send 1 BTC",
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
      name: "Send Max BTC",
      useAllAmount: true,
      recipient: VITALIK,
      expect: (previousAccount, currentAccount) => {
        const [latestOperation] = currentAccount.operations;
        expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
        expect(latestOperation.type).toBe("OUT");
        expect(currentAccount.balance.toFixed()).toBe("0");
        expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
        expectAddressInList(latestOperation.recipients, VITALIK);
      },
    },
  ],
  beforeSync: async () => {
    await indexBlocks(ALPEN_TESTNET_CHAIN_ID);
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
  },
  afterEach: async account => {
    await expectLegacyTransaction(account.operations[0].hash, BigInt(ALPEN_TESTNET_MIN_GAS_PRICE));
  },
  afterAll: account => {
    expect(account.operations.length).toBe(2);
  },
  teardown: async () => {
    await killAnvil();
    resetIndexer();
  },
};
