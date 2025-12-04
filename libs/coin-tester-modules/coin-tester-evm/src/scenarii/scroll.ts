import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { resetIndexer, setBlock, indexBlocks, initMswHandlers } from "../indexer";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { makeAccount } from "../fixtures";
import { callMyDealer, getBridges, scroll, VITALIK } from "../helpers";
import { defaultNanoApp } from "../constants";
import { killAnvil, spawnAnvil } from "../anvil";
import { USDC_ON_SCROLL } from "../tokenFixtures";

type ScrollScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

const makeScenarioTransactions = ({
  address,
}: {
  address: string;
}): ScrollScenarioTransaction[] => {
  const scenarioSendEthTransaction: ScrollScenarioTransaction = {
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
    },
  };

  const scenarioSendUSDCTransaction: ScrollScenarioTransaction = {
    name: "Send USDC",
    amount: new BigNumber(ethers.parseUnits("80", USDC_ON_SCROLL.units[0].magnitude).toString()),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:scroll:${address}:`, USDC_ON_SCROLL),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", USDC_ON_SCROLL.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.parseUnits("20", USDC_ON_SCROLL.units[0].magnitude).toString(),
      );
    },
  };

  return [scenarioSendEthTransaction, scenarioSendUSDCTransaction];
};

export const scenarioScroll: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic Scroll Transactions",
  setup: async () => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://rpc.scroll.io"),
    ]);

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    setBlock(lastBlockNumber + 1);

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
          uri: "https://api.scrollscan.com/api",
        },
        showNfts: true,
      },
    }));
    initMswHandlers(getCoinConfig(scroll).info);

    const onSignerConfirmation = getOnSpeculosConfirmation();
    const { currencyBridge, accountBridge, getAddress } = getBridges(transport, "scroll");
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: scroll,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, scroll);

    await callMyDealer({
      provider,
      drug: USDC_ON_SCROLL,
      junkie: address,
      dose: ethers.parseUnits("100", USDC_ON_SCROLL.units[0].magnitude),
    });

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
      onSignerConfirmation,
      retryLimit: 0,
    };
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  beforeSync: async () => {
    await indexBlocks();
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    expect(account.subAccounts?.[0]?.type).toBe("TokenAccount");
    expect(account.subAccounts?.[0]?.balance?.toFixed()).toBe(
      ethers.parseUnits("100", USDC_ON_SCROLL.units[0].magnitude).toString(),
    );
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("20", USDC_ON_SCROLL.units[0].magnitude).toString(),
    );
    expect(account.operations.length).toBe(3);
  },
  teardown: async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
    resetIndexer();
  },
};
