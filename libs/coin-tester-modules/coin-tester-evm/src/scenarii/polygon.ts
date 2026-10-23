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
import { expectAddressInList, getBridges, polygon, VITALIK } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { USDC_ON_POLYGON } from "../tokenFixtures";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type PolygonScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const makeScenarioTransactions = ({ address }: { address: string }) => {
  const scenarioSend1MaticTransaction: PolygonScenarioTransaction = {
    name: "Send 1 POL",
    amount: new BigNumber(ethers.parseEther("1").toString()),
    recipient: ethers.ZeroAddress,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(
        latestOperation.fee.plus(new BigNumber("1000000000000000000")).toFixed(),
      );
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const scenarioSend80USDCTransaction: PolygonScenarioTransaction = {
    name: "Send 80 USDC",
    recipient: VITALIK,
    amount: new BigNumber(ethers.parseUnits("80", USDC_ON_POLYGON.units[0].magnitude).toString()),
    subAccountId: encodeTokenAccountId(`js:2:polygon:${address}:`, USDC_ON_POLYGON),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", USDC_ON_POLYGON.units[0].magnitude).toString(),
      );
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, USDC_ON_POLYGON.contractAddress);
      const subOp = latestOperation.subOperations?.[0];
      expectAddressInList(subOp?.senders, currentAccount.freshAddress);
      expectAddressInList(subOp?.recipients, VITALIK);
    },
  };

  const scenarioSendMaxMaticTransaction: PolygonScenarioTransaction = {
    name: "Send Max MATIC",
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

  return [
    scenarioSend1MaticTransaction,
    scenarioSend80USDCTransaction,
    scenarioSendMaxMaticTransaction,
  ];
};

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | null = null;
// Puts the token store of the other scenarios of the run back
let restoreTokens: (() => void) | null = null;
let provider: ethers.JsonRpcProvider;
let atlas: ReturnType<typeof atlasOf>;

/** Whole units airdropped to the scenario's account: the chain starts with the dealer only. */
const POL_AIRDROP = 10_000;
const USDC_AIRDROP = 100;

export const scenarioPolygon: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Polygon Transactions",
  setup: async () => {
    const signer = await buildSigner();
    sandbox = await startSandbox(
      { family: "evm", network: "polygon" },
      {
        node: { provider: "bor", version: "2.10.2" },
        indexer: { provider: "atlas", version: "2.38.16" },
      },
    );
    const { node: rpc, indexer: explorer } = sandbox.endpoints;
    if (rpc === undefined || explorer === undefined) {
      throw new Error("the sandbox instance has no node or indexer endpoint");
    }
    atlas = atlasOf(explorer, "matic");

    const info: EvmConfigInfo = {
      status: {
        type: "active",
      },
      chainId: 137,
      name: "Polygon",
      unit: { name: "POL", code: "POL", magnitude: 18 },
      node: {
        type: "external",
        uri: rpc,
      },
      gasTracker: {
        type: "ledger",
        explorerId: "matic",
      },
      explorer: {
        type: "ledger",
        explorerId: "matic",
      },
      // The `ledger` explorer and gas tracker are the sandbox's Atlas
      ledgerExplorerUri: explorer,
      supportedTokens: ["erc721", "erc1155"],
    };
    LiveConfig.setConfig({
      config_currency_polygon: {
        type: "object",
        default: info,
      },
    });

    // USDC (PoS), the bridged one, is a mainnet token the sandbox preloads at its address
    restoreTokens = swapTokens(polygon.id, [USDC_ON_POLYGON]);

    closeGuard = forbidRemoteRequests();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: polygon,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, polygon);

    provider = new ethers.JsonRpcProvider(rpc);

    // The chain starts with the dealer only: the account gets its POL and its USDC by airdrop
    await sandbox.airdrop(address, POL_AIRDROP);
    await sandbox.airdrop(address, USDC_AIRDROP, USDC_ON_POLYGON.contractAddress);
    // The first sync must see both airdrops, and the first transaction a gas tracker that has seen them
    await atlas.waitForBlock(await provider.getBlockNumber());
    await atlas.waitForGasTracker();

    return { currencyBridge, accountBridge, account: scenarioAccount };
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  mockIndexer: async (_account, optimistic) => {
    const receipt = await provider.waitForTransaction(optimistic.hash, 1, 60_000);
    if (receipt === null) throw new Error(`${optimistic.hash} is not in a block after 60 s`);
    await atlas.waitForBlock(receipt.blockNumber);
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    expect(account.subAccounts?.[0].type).toBe("TokenAccount");
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(0);
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("20", USDC_ON_POLYGON.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(0);
    // The POL airdrop (IN), the USDC airdrop (NONE on the parent account), then the three sends
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
