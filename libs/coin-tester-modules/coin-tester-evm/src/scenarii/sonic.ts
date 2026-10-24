import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { makeAccount } from "../fixtures";
import { swapTokens } from "../sandboxEvm";
import { VITALIK, expectAddressInList, getBridges, sonic } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { BRIDGED_USDC_ON_SONIC as USDC_ON_SONIC } from "../tokenFixtures";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type SonicScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

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
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, USDC_ON_SONIC.contractAddress);
      const subOp = latestOperation.subOperations?.[0];
      expectAddressInList(subOp?.senders, currentAccount.freshAddress);
      expectAddressInList(subOp?.recipients, VITALIK);
    },
  };

  const scenarioSendMaxSTransaction: SonicScenarioTransaction = {
    name: "Send Max S",
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

  return [scenarioSendSTransaction, scenarioSendUSDCTransaction, scenarioSendMaxSTransaction];
};

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | null = null;
// Puts the token store of the other scenarios of the run back
let restoreTokens: (() => void) | null = null;
let provider: ethers.JsonRpcProvider;

/** Whole units airdropped to the scenario's account: the chain starts with the dealer only. */
const S_AIRDROP = 10_000;
const USDC_AIRDROP = 100;

export const scenarioSonic: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic S Transactions",
  setup: async () => {
    const signer = await buildSigner();
    sandbox = await startSandbox(
      { family: "evm", network: "sonic" },
      {
        node: { implementation: "sonic", version: "2.2.5" },
        indexer: { implementation: "etherscan-stub" },
      },
    );
    const { node: rpc, indexer: explorer } = sandbox.endpoints;
    if (rpc === undefined || explorer === undefined) {
      throw new Error("the sandbox instance has no node or indexer endpoint");
    }

    const info: EvmConfigInfo = {
      status: {
        type: "active",
      },
      chainId: 146,
      name: "Sonic",
      unit: { name: "S", code: "S", magnitude: 18 },
      node: {
        type: "external",
        uri: rpc,
      },
      // The stub answers the Etherscan API from the node, as production's explorer does
      explorer: {
        type: "etherscan",
        noCache: true,
        uri: `${explorer}/api`,
      },
      supportedTokens: ["erc721", "erc1155"],
    };
    LiveConfig.setConfig({
      config_currency_sonic: {
        type: "object",
        default: info,
      },
    });

    // USDC.e is a mainnet token the sandbox preloads at its address
    restoreTokens = swapTokens(sonic.id, [USDC_ON_SONIC]);

    closeGuard = forbidRemoteRequests();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: sonic,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, sonic);

    provider = new ethers.JsonRpcProvider(rpc);

    // The chain starts with the dealer only: the account gets its S and its USDC.e by airdrop
    await sandbox.airdrop(address, S_AIRDROP);
    await sandbox.airdrop(address, USDC_AIRDROP, USDC_ON_SONIC.contractAddress);

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
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
  mockIndexer: async (_account, optimistic) => {
    const receipt = await provider.waitForTransaction(optimistic.hash, 1, 60_000);
    if (receipt === null) throw new Error(`${optimistic.hash} is not in a block after 60 s`);
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("20", USDC_ON_SONIC.units[0].magnitude).toString(),
    );
    // The S airdrop (IN), the USDC.e airdrop (NONE on the parent account), then the three sends
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
