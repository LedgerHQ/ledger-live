import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { ethers, providers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { resetIndexer, setBlock, indexBlocks, initMswHandlers } from "../indexer";
import { buildAccountBridge, buildCurrencyBridge } from "../../../bridge/js";
import { getCoinConfig, setCoinConfig } from "../../../config";
import { Transaction as EvmTransaction } from "../../../types";
import { makeAccount } from "../../fixtures/common.fixtures";
import { blast, callMyDealer, VITALIK } from "../helpers";
import { defaultNanoApp } from "../scenarii.test";
import { killAnvil, spawnAnvil } from "../anvil";
import resolver from "../../../hw-getAddress";

type BlastScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

// getTokenById will only work after the currency has been preloaded
const TOKEN_ID = "blast/erc20/magic_internet_money";

const makeScenarioTransactions = ({ address }: { address: string }): BlastScenarioTransaction[] => {
  const scenarioSendEthTransaction: BlastScenarioTransaction = {
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

  const MIM_ON_BLAST = getTokenById(TOKEN_ID);
  const scenarioSendMIMTransaction: BlastScenarioTransaction = {
    name: "Send 80 MIM",
    amount: new BigNumber(
      ethers.utils.parseUnits("80", MIM_ON_BLAST.units[0].magnitude).toString(),
    ),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:blast:${address}:`, MIM_ON_BLAST),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.utils.parseUnits("80", MIM_ON_BLAST.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.utils.parseUnits("20", MIM_ON_BLAST.units[0].magnitude).toString(),
      );
    },
  };

  return [scenarioSendEthTransaction, scenarioSendMIMTransaction];
};

export const scenarioBlast: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic Blast Transactions",
  setup: async () => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://rpc.blast.io"),
    ]);

    const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
    const signerContext: Parameters<typeof resolver>[0] = (deviceId, fn) => fn(new Eth(transport));

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    await setBlock(lastBlockNumber + 1);

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
          uri: "https://api.blastscan.io/api",
        },
      },
    }));
    initMswHandlers(getCoinConfig(blast).info);

    const onSignerConfirmation = getOnSpeculosConfirmation();
    const currencyBridge = buildCurrencyBridge(signerContext);
    await currencyBridge.preload(blast);
    const accountBridge = buildAccountBridge(signerContext);
    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: blast,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, blast);

    const MIM_ON_BLAST = getTokenById(TOKEN_ID);
    await callMyDealer({
      provider,
      drug: MIM_ON_BLAST,
      junkie: address,
      dose: ethers.utils.parseUnits("100", MIM_ON_BLAST.units[0].magnitude),
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
    const MIM_ON_BLAST = getTokenById(TOKEN_ID);
    expect(account.balance.toFixed()).toBe(ethers.utils.parseEther("10000").toString());
    expect(account.subAccounts?.[0]?.type).toBe("TokenAccount");
    expect(account.subAccounts?.[0]?.balance?.toFixed()).toBe(
      ethers.utils.parseUnits("100", MIM_ON_BLAST.units[0].magnitude).toString(),
    );
  },
  afterAll: account => {
    const MIM_ON_BLAST = getTokenById(TOKEN_ID);
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.utils.parseUnits("20", MIM_ON_BLAST.units[0].magnitude).toString(),
    );
    expect(account.operations.length).toBe(3);
  },
  teardown: async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
    resetIndexer();
  },
};
