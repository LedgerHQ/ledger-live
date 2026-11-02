import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { makeAccount } from "../fixtures";
import { blockscoutOf, swapTokens } from "../sandboxEvm";
import { VITALIK, expectAddressInList, getBridges, robinhood } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type RobinhoodScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const makeScenarioTransactions = (): RobinhoodScenarioTransaction[] => [
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
];

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | null = null;
// Puts the token store of the other scenarios of the run back
let restoreTokens: (() => void) | null = null;
let provider: ethers.JsonRpcProvider;
let blockscout: ReturnType<typeof blockscoutOf>;

/** Whole units airdropped to the scenario's account: the chain starts with the dealer only. */
const ETH_AIRDROP = 10_000;

export const scenarioRobinhood: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Robinhood Transactions",
  setup: async () => {
    const signer = await buildSigner();
    sandbox = await startSandbox(
      { family: "evm", network: "robinhood" },
      {
        node: { implementation: "nitro", version: "3.12.2" },
        indexer: { implementation: "blockscout", version: "12.0.3" },
      },
    );
    const { node: rpc, indexer: explorer } = sandbox.endpoints;
    if (rpc === undefined || explorer === undefined) {
      throw new Error("the sandbox instance has no node or indexer endpoint");
    }
    blockscout = blockscoutOf(explorer);

    const info: EvmConfigInfo = {
      status: { type: "active" },
      chainId: 4663,
      name: "Robinhood Chain",
      unit: { name: "ether", code: "ETH", magnitude: 18 },
      node: { type: "external", uri: rpc },
      // Blockscout answers the Etherscan API and the internal transactions, as production's does
      explorer: { type: "blockscout", noCache: true, uri: `${explorer}/api` },
    };
    LiveConfig.setConfig({
      config_currency_robinhood: {
        type: "object",
        default: info,
      },
    });

    // The chain preloads no token: an empty store, so that nothing asks the CAL
    restoreTokens = swapTokens(robinhood.id, []);

    closeGuard = forbidRemoteRequests();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: robinhood,
      derivationMode: "",
    });

    provider = new ethers.JsonRpcProvider(rpc);

    // The chain starts with the dealer only: the account gets its ETH by airdrop
    await sandbox.airdrop(address, ETH_AIRDROP);
    // The first sync must see the airdrop
    await blockscout.waitForBlock(await provider.getBlockNumber());

    return {
      currencyBridge,
      accountBridge,
      account: makeAccount(address, robinhood),
    };
  },
  getTransactions: () => makeScenarioTransactions(),
  mockIndexer: async (_account, optimistic) => {
    const receipt = await provider.waitForTransaction(optimistic.hash, 1, 60_000);
    if (receipt === null) throw new Error(`${optimistic.hash} is not in a block after 60 s`);
    await blockscout.waitForBlock(receipt.blockNumber);
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
  },
  afterAll: account => {
    // The airdrop (IN), then the two sends
    expect(account.operations.length).toBe(3);
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
