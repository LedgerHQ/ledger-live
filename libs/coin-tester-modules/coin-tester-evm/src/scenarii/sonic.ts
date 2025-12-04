import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { resetIndexer, indexBlocks, initMswHandlers, setBlock } from "../indexer";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { makeAccount } from "../fixtures";
import { VITALIK, callMyDealer, getBridges, sonic } from "../helpers";
import { defaultNanoApp } from "../constants";
import { killAnvil, spawnAnvil } from "../anvil";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { BRIDGED_USDC_ON_SONIC } from "../tokenFixtures";

type SonicScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

const USDC_ON_SONIC = BRIDGED_USDC_ON_SONIC;

const makeScenarioTransactions = ({ address }: { address: string }): SonicScenarioTransaction[] => {
  const scenarioSendSTransaction: SonicScenarioTransaction = {
    name: "Send 1 S",
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

  const scenarioSendUSDCTransaction: SonicScenarioTransaction = {
    name: "Send USDC",
    amount: new BigNumber(ethers.parseUnits("80", USDC_ON_SONIC.units[0].magnitude).toString()),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:sonic:${address}:`, USDC_ON_SONIC),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", USDC_ON_SONIC.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.parseUnits("20", USDC_ON_SONIC.units[0].magnitude).toString(),
      );
    },
  };

  return [scenarioSendSTransaction, scenarioSendUSDCTransaction];
};

export const scenarioSonic: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic S Transactions",
  setup: async () => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Sonic/app_${defaultNanoApp.version}.elf`, {
        libraries: [
          {
            name: "Ethereum",
            endpoint: "/2.4.2/Ethereum/app_1.17.0.elf",
          },
        ],
      }),
      spawnAnvil("https://sonic-rpc.publicnode.com"),
    ]);

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
          uri: "https://proxyetherscan.api.live.ledger.com/v2/api/146",
        },
        showNfts: true,
      },
    }));
    LiveConfig.setConfig({
      config_currency_sonic: {
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
            uri: "https://proxyetherscan.api.live.ledger.com/v2/api/146",
          },
          showNfts: true,
        },
      },
    });

    initMswHandlers(getCoinConfig(sonic).info);

    const onSignerConfirmation = getOnSpeculosConfirmation();
    const { currencyBridge, accountBridge, getAddress } = getBridges(transport, "sonic");
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: sonic,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, sonic);

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    setBlock(lastBlockNumber + 1);

    // Get USDC
    await callMyDealer({
      provider,
      drug: USDC_ON_SONIC,
      junkie: address,
      dose: ethers.parseUnits("100", USDC_ON_SONIC.units[0].magnitude),
    });

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
      onSignerConfirmation,
    };
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    expect(account.subAccounts?.[0].type).toBe("TokenAccount");
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("100", USDC_ON_SONIC.units[0].magnitude).toString(),
    );
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  beforeSync: async () => {
    await indexBlocks();
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("20", USDC_ON_SONIC.units[0].magnitude).toString(),
    );
  },
  teardown: async () => {
    resetIndexer();
    await Promise.all([killSpeculos(), killAnvil()]);
  },
};
