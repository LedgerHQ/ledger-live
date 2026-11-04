import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { makeAccount } from "../fixtures";
import { blockscoutOf, swapTokens } from "../sandboxEvm";
import { VITALIK, alpenTestnet, expectAddressInList, getBridges } from "../helpers";
import { buildSigner } from "../signer";

type AlpenTestnetScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

// The floor of production's configuration: Live sends legacy transactions, priced at least at this gas price
const MIN_GAS_PRICE = "2000000";

const makeScenarioTransactions = (): AlpenTestnetScenarioTransaction[] => [
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
];

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | null = null;
// Puts the token store of the other scenarios of the run back
let restoreTokens: (() => void) | null = null;
let provider: ethers.JsonRpcProvider;
let blockscout: ReturnType<typeof blockscoutOf>;

/** Whole units airdropped to the scenario's account: the chain starts with the dealer only. */
const BTC_AIRDROP = 10_000;

export const scenarioAlpenTestnet: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Alpen Testnet Transactions",
  setup: async () => {
    const signer = await buildSigner();
    sandbox = await startSandbox(
      { family: "evm", network: "alpen_testnet" },
      {
        node: { implementation: "alpen-client", version: "0.4.0" },
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
      chainId: 20310,
      name: "Alpen Testnet",
      unit: { name: "BTC", code: "BTC", magnitude: 18 },
      node: { type: "external", uri: rpc },
      // Blockscout answers the Etherscan API and the internal transactions, as production's does
      explorer: { type: "blockscout", noCache: true, uri: `${explorer}/api` },
      forceLegacyTransactions: true,
      minGasPrice: MIN_GAS_PRICE,
    };
    LiveConfig.setConfig({
      config_currency_alpen_testnet: {
        type: "object",
        default: info,
      },
    });

    // The chain preloads no token: an empty store, so that nothing asks the CAL
    restoreTokens = swapTokens(alpenTestnet.id, []);

    closeGuard = forbidRemoteRequests();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: alpenTestnet,
      derivationMode: "",
    });

    provider = new ethers.JsonRpcProvider(rpc);

    // The chain starts with the dealer only: the account gets its BTC by airdrop
    await sandbox.airdrop(address, BTC_AIRDROP);
    // The first sync must see the airdrop
    await blockscout.waitForBlock(await provider.getBlockNumber());

    return {
      currencyBridge,
      accountBridge,
      account: makeAccount(address, alpenTestnet),
    };
  },
  getTransactions: () => makeScenarioTransactions(),
  mockIndexer: async (_account, optimistic) => {
    const receipt = await provider.waitForTransaction(optimistic.hash, 1, 60_000);
    if (receipt === null) throw new Error(`${optimistic.hash} is not in a block after 60 s`);
    await blockscout.waitForBlock(receipt.blockNumber);
    // What the configuration asks for: a legacy transaction, priced at the floor or above
    const transaction = await provider.getTransaction(optimistic.hash);
    expect(transaction?.type).toBe(0);
    expect(transaction?.gasPrice ?? 0n).toBeGreaterThanOrEqual(BigInt(MIN_GAS_PRICE));
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
