import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { ethers, providers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { resetIndexer, indexBlocks, initMswHandlers, setBlock } from "../indexer";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { buildAccountBridge, buildCurrencyBridge } from "@ledgerhq/coin-evm/bridge/js";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { makeAccount } from "@ledgerhq/coin-evm/__tests__/fixtures/common.fixtures";
import { VITALIK, callMyDealer, sonic } from "../helpers";
import { defaultNanoApp } from "../scenarii.test";
import { killAnvil, spawnAnvil } from "../anvil";
import resolver from "@ledgerhq/coin-evm/hw-getAddress";

type SonicScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

const USDC_ON_SONIC = getTokenById(
  "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
);

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
    amount: new BigNumber(
      ethers.utils.parseUnits("80", USDC_ON_SONIC.units[0].magnitude).toString(),
    ),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:sonic:${address}:`, USDC_ON_SONIC),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.utils.parseUnits("80", USDC_ON_SONIC.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.utils.parseUnits("20", USDC_ON_SONIC.units[0].magnitude).toString(),
      );
    },
  };

  return [scenarioSendSTransaction, scenarioSendUSDCTransaction];
};

export const scenarioSonic: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic S Transactions",
  setup: async () => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://rpc.ankr.com/sonic_mainnet"),
    ]);

    const signerContext: Parameters<typeof resolver>[0] = (_, fn) => fn(new Eth(transport));

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
      },
    }));

    initMswHandlers(getCoinConfig(sonic).info);

    const onSignerConfirmation = getOnSpeculosConfirmation();
    const currencyBridge = buildCurrencyBridge(signerContext);
    const accountBridge = buildAccountBridge(signerContext);
    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: sonic,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, sonic);

    const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    setBlock(lastBlockNumber + 1);

    // Get USDC
    await callMyDealer({
      provider,
      drug: USDC_ON_SONIC,
      junkie: address,
      dose: ethers.utils.parseUnits("100", USDC_ON_SONIC.units[0].magnitude),
    });

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
      onSignerConfirmation,
    };
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.utils.parseEther("10000").toString());
    expect(account.subAccounts?.[0].type).toBe("TokenAccount");
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.utils.parseUnits("100", USDC_ON_SONIC.units[0].magnitude).toString(),
    );
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  beforeSync: async () => {
    await indexBlocks();
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.utils.parseUnits("20", USDC_ON_SONIC.units[0].magnitude).toString(),
    );
    // expect(account.operations.length).toBe(3);
  },
  teardown: async () => {
    resetIndexer();
    await Promise.all([killSpeculos(), killAnvil()]);
  },
};
