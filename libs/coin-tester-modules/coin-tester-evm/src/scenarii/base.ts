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
import { blockscoutOf, swapTokens } from "../sandboxEvm";
import { base, expectAddressInList, getBridges, VITALIK } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { USDC_ON_BASE } from "../tokenFixtures";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type BaseScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const makeScenarioTransactions = ({ address }: { address: string }): BaseScenarioTransaction[] => {
  const scenarioSendBaseTransaction: BaseScenarioTransaction = {
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
  };

  const scenarioSendUSDCTransaction: BaseScenarioTransaction = {
    name: "Send USDC",
    amount: new BigNumber(ethers.parseUnits("80", USDC_ON_BASE.units[0].magnitude).toString()),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:base:${address}:`, USDC_ON_BASE),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", USDC_ON_BASE.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.parseUnits("20", USDC_ON_BASE.units[0].magnitude).toString(),
      );
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, USDC_ON_BASE.contractAddress);
      const subOp = latestOperation.subOperations?.[0];
      expectAddressInList(subOp?.senders, currentAccount.freshAddress);
      expectAddressInList(subOp?.recipients, VITALIK);
    },
  };

  const scenarioSendMaxEthTransaction: BaseScenarioTransaction = {
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
  };

  return [scenarioSendBaseTransaction, scenarioSendUSDCTransaction, scenarioSendMaxEthTransaction];
};

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | null = null;
// Puts the token store of the other scenarios of the run back
let restoreTokens: (() => void) | null = null;
let provider: ethers.JsonRpcProvider;
let blockscout: ReturnType<typeof blockscoutOf>;

/** Whole units airdropped to the scenario's account: the chain starts with the dealer only. */
const ETH_AIRDROP = 10_000;
const USDC_AIRDROP = 100;

export const scenarioBase: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Base Transactions",
  setup: async () => {
    const signer = await buildSigner();
    sandbox = await startSandbox(
      { family: "evm", network: "base" },
      {
        node: { provider: "reth", version: "2.5.2" },
        indexer: { provider: "blockscout", version: "12.0.3" },
      },
    );
    const { node: rpc, indexer: explorer } = sandbox.endpoints;
    if (rpc === undefined || explorer === undefined) {
      throw new Error("the sandbox instance has no node or indexer endpoint");
    }
    blockscout = blockscoutOf(explorer);

    const info: EvmConfigInfo = {
      status: {
        type: "active",
      },
      chainId: 8453,
      name: "Base",
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
      node: {
        type: "external",
        uri: rpc,
      },
      // Blockscout answers the etherscan API, internal transactions included
      explorer: {
        type: "blockscout",
        noCache: true,
        uri: `${explorer}/api`,
      },
      supportedTokens: ["erc721", "erc1155"],
    };
    LiveConfig.setConfig({
      config_currency_base: {
        type: "object",
        default: info,
      },
    });

    // USDC is a mainnet token the sandbox preloads at its address
    restoreTokens = swapTokens(base.id, [USDC_ON_BASE]);

    closeGuard = forbidRemoteRequests();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: base,
      derivationMode: "",
    });
    const scenarioAccount = makeAccount(address, base);

    provider = new ethers.JsonRpcProvider(rpc);

    // The chain starts with the dealer only: the account gets its ETH and its USDC by airdrop
    await sandbox.airdrop(address, ETH_AIRDROP);
    await sandbox.airdrop(address, USDC_AIRDROP, USDC_ON_BASE.contractAddress);
    // The first sync must see both airdrops
    await blockscout.waitForBlock(await provider.getBlockNumber());

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
    await blockscout.waitForBlock(receipt.blockNumber);
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    expect(account.subAccounts?.[0]?.type).toBe("TokenAccount");
    expect(account.subAccounts?.[0]?.balance?.toFixed()).toBe(
      ethers.parseUnits("100", USDC_ON_BASE.units[0].magnitude).toString(),
    );
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("20", USDC_ON_BASE.units[0].magnitude).toString(),
    );
    // The ETH airdrop (IN), the USDC airdrop (NONE on the parent account), then the three sends
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
