import { makeAccount } from "../fixtures";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { VITALIK, core, expectAddressInList, getBridges } from "../helpers";
import { swapTokens } from "../sandboxEvm";
import { STCORE_ON_CORE } from "../tokenFixtures";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type CoreScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const makeScenarioTransactions = ({ address }: { address: string }): CoreScenarioTransaction[] => {
  const scenarioSendCoreTransaction: CoreScenarioTransaction = {
    name: "Send 1 CORE",
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

  // TODO: export when explorer is ready because last token operations come from explorer
  const _scenarioSendSTCORETransaction: CoreScenarioTransaction = {
    name: "Send STCORE",
    amount: new BigNumber(ethers.parseUnits("80", STCORE_ON_CORE.units[0].magnitude).toString()),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:core:${address}:`, STCORE_ON_CORE),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", STCORE_ON_CORE.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.parseUnits("20", STCORE_ON_CORE.units[0].magnitude).toString(),
      );
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, STCORE_ON_CORE.contractAddress);
      const subOp = latestOperation.subOperations?.[0];
      expectAddressInList(subOp?.senders, currentAccount.freshAddress);
      expectAddressInList(subOp?.recipients, VITALIK);
    },
  };

  const scenarioSendMaxCoreTransaction: CoreScenarioTransaction = {
    name: "Send Max CORE",
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

  return [scenarioSendCoreTransaction, scenarioSendMaxCoreTransaction];
};

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | null = null;
// Puts the token store of the other scenarios of the run back
let restoreTokens: (() => void) | null = null;
let provider: ethers.JsonRpcProvider;

/** Whole units airdropped to the scenario's account: the chain starts with the dealer only. */
const CORE_AIRDROP = 10_000;

export const scenarioCore: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic CORE Transactions",
  setup: async () => {
    const signer = await buildSigner();
    // The node alone: Live has no explorer for Core
    sandbox = await startSandbox(
      { family: "evm", network: "core" },
      { node: { implementation: "geth", version: "1.0.27" } },
    );
    const { node: rpc } = sandbox.endpoints;
    if (rpc === undefined) {
      throw new Error("the sandbox instance has no node endpoint");
    }

    provider = new ethers.JsonRpcProvider(rpc);

    const info: EvmConfigInfo = {
      status: {
        type: "active",
      },
      chainId: 1116,
      name: "Core",
      unit: { name: "CORE", code: "CORE", magnitude: 18 },
      node: {
        type: "external",
        uri: rpc,
      },
      explorer: {
        type: "none",
      },
      supportedTokens: ["erc721", "erc1155"],
    };
    LiveConfig.setConfig({
      config_currency_core: {
        type: "object",
        default: info,
      },
    });

    // The chain preloads no token: an empty store, so that nothing asks the CAL
    restoreTokens = swapTokens(core.id, []);

    closeGuard = forbidRemoteRequests();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: core,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, core);

    // The chain starts with the dealer only: the account gets its CORE by airdrop
    await sandbox.airdrop(address, CORE_AIRDROP);

    // Get STCORE
    // TODO: uncomment when explorer is ready
    // await callMyDealer({
    //   provider,
    //   drug: STCORE_ON_CORE,
    //   junkie: address,
    //   dose: ethers.parseUnits("100", STCORE_ON_CORE.units[0].magnitude),
    // });

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
    };
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    // TODO: uncomment when explorer is ready
    // expect(account.subAccounts?.[0]?.type).toBe("TokenAccount");
    // expect(account.subAccounts?.[0]?.balance?.toFixed()).toBe(
    //   ethers.parseUnits("100", STCORE_ON_CORE.units[0].magnitude).toString(),
    // );
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  // No indexer: the node is the only source, so a sync must come after the block of the transaction
  mockIndexer: async (_account, optimistic) => {
    const receipt = await provider.waitForTransaction(optimistic.hash, 1, 60_000);
    if (receipt === null) throw new Error(`${optimistic.hash} is not in a block after 60 s`);
  },
  afterAll: _account => {
    // TODO: uncomment when explorer is ready
    // expect(account.subAccounts?.length).toBe(1);
    // expect(account.subAccounts?.[0].balance.toFixed()).toBe(
    //   ethers.parseUnits("20", STCORE_ON_CORE.units[0].magnitude).toString(),
    // );
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
