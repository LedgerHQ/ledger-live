import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { makeAccount } from "../fixtures";
import { atlasOf, swapTokens } from "../sandboxEvm";
import { expectAddressInList, getBridges, bnb, VITALIK } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { USDT_ON_BNB } from "../tokenFixtures";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type BnbScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

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
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, VITALIK);
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
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, USDT_ON_BNB.contractAddress);
      const subOp = latestOperation.subOperations?.[0];
      expectAddressInList(subOp?.senders, currentAccount.freshAddress);
      expectAddressInList(subOp?.recipients, VITALIK);
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
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, VITALIK);
    },
  };

  return [scenarioSendBNBTransaction, scenarioSendUSDTTransaction, scenarioSendMaxBNBTransaction];
};

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | null = null;
// Puts the token store of the other scenarios of the run back
let restoreTokens: (() => void) | null = null;
let provider: ethers.JsonRpcProvider;
let atlas: ReturnType<typeof atlasOf>;

/** Whole units airdropped to the scenario's account: the chain starts with the dealer only. */
const BNB_AIRDROP = 10_000;
const USDT_AIRDROP = 100;

export const scenarioBnb: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic BNB Transactions",
  setup: async () => {
    const signer = await buildSigner();
    sandbox = await startSandbox(
      { family: "evm", network: "bsc" },
      {
        node: { implementation: "geth", version: "1.8.1" },
        indexer: { implementation: "atlas", version: "2.38.21" },
      },
    );
    const { node: rpc, indexer: explorer } = sandbox.endpoints;
    if (rpc === undefined || explorer === undefined) {
      throw new Error("the sandbox instance has no node or indexer endpoint");
    }
    atlas = atlasOf(explorer, "bnb");

    const info: EvmConfigInfo = {
      status: {
        type: "active",
      },
      chainId: 56,
      name: "BNB Smart Chain",
      unit: { name: "BNB", code: "BNB", magnitude: 18 },
      gasTracker: {
        type: "ledger",
        explorerId: "bnb",
      },
      node: {
        type: "external",
        uri: rpc,
      },
      explorer: {
        type: "ledger",
        explorerId: "bnb",
      },
      // The `ledger` explorer and gas tracker are the sandbox's Atlas
      ledgerExplorerUri: explorer,
      supportedTokens: ["erc721", "erc1155"],
    };
    LiveConfig.setConfig({
      config_currency_bsc: {
        type: "object",
        default: info,
      },
    });

    // BSC-USD (USDT) is a mainnet token the sandbox preloads at its address
    restoreTokens = swapTokens(bnb.id, [USDT_ON_BNB]);

    closeGuard = forbidRemoteRequests();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: bnb,
      derivationMode: "",
    });
    const scenarioAccount = makeAccount(address, bnb);

    provider = new ethers.JsonRpcProvider(rpc);

    // The chain starts with the dealer only: the account gets its BNB and its USDT by airdrop
    await sandbox.airdrop(address, BNB_AIRDROP);
    await sandbox.airdrop(address, USDT_AIRDROP, USDT_ON_BNB.contractAddress);
    // The first sync must see both airdrops, and the first transaction a gas tracker that has seen them
    await atlas.waitForBlock(await provider.getBlockNumber());
    await atlas.waitForGasTracker();

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
    };
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  mockIndexer: async (_account, optimistic) => {
    const receipt = await provider.waitForTransaction(optimistic.hash, 1, 60_000);
    if (receipt === null) throw new Error(`${optimistic.hash} is not in a block after 60 s`);
    await atlas.waitForBlock(receipt.blockNumber);
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
    // The BNB airdrop (IN), the USDT airdrop (NONE on the parent account), then the three sends
    expect(account.operations.length).toBe(5);
  },
  teardown: async () => {
    closeGuard?.();
    closeGuard = null;
    restoreTokens?.();
    restoreTokens = null;
    await sandbox?.down();
    sandbox = undefined;
  },
};
