import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { sandboxVersions } from "@ledgerhq/coin-tester/versions";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { makeAccount } from "../fixtures";
import { blockscoutOf, swapTokens } from "../sandboxEvm";
import { VITALIK, arc, expectAddressInList, getBridges } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { buildSigner } from "../signer";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";

type ArcScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

// USDC is the chain's native unit on Arc, exposed as an ERC-20 at this address (6 decimals).
const ARC_USDC_NATIVE_CONTRACT = "0x3600000000000000000000000000000000000000";

// The USDC of the CAL for Arc (`arc/erc20/usdc_0x3600…`): the token Live knows, as in production
const ARC_USDC: TokenCurrency = {
  type: "TokenCurrency",
  id: "arc/erc20/usdc_0x3600000000000000000000000000000000000000",
  contractAddress: ARC_USDC_NATIVE_CONTRACT,
  parentCurrencyId: arc.id,
  tokenType: "erc20",
  name: "USDC",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as TokenCurrency;

/**
 * Send Arc's native USDC (the chain's base gas token).
 *
 * The node emits a native transfer as an ERC-20 `Transfer` log from `0xff…fe` (EIP-7708), which the Blockscout of Arc (built
 * for the `arc` chain type, as in production) reports as a transfer of the USDC token `0x36…`. `nativeContracts` is what makes
 * `@ledgerhq/coin-evm` drop it (its Etherscan explorer filters the `tokentx` of those contracts, and its balance skips them): a
 * single native operation appears per transfer. The scenario checks that the explorer does report the mirror (`mockIndexer`),
 * otherwise "no sub-operation" would prove nothing; without `nativeContracts` it fails, on a USDC sub-operation.
 * The ERC-20 calldata path (`transfer(address,uint256)` on `0x36…`) is not covered here.
 */
const makeScenarioTransactions = (): ArcScenarioTransaction[] => [
  {
    name: "Send 1 USDC (native)",
    amount: new BigNumber(1e18),
    recipient: VITALIK,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e18).toFixed());
      // No sub-operation for the ERC-20 mirror: `nativeContracts` dropped it
      expect(latestOperation.subOperations ?? []).toEqual([]);
      expectAddressInList(latestOperation.senders, currentAccount.freshAddress);
      expectAddressInList(latestOperation.recipients, VITALIK);
    },
  },
  {
    name: "Send Max USDC (native)",
    useAllAmount: true,
    recipient: VITALIK,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  },
];

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | null = null;
// Puts the token store of the other scenarios of the run back
let restoreTokens: (() => void) | null = null;
let provider: ethers.JsonRpcProvider;
let blockscout: ReturnType<typeof blockscoutOf>;
let explorerUrl: string;

/** Whole units airdropped to the scenario's account: the chain starts with the dealer only. */
const USDC_AIRDROP = 10_000;

export const scenarioArc: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Arc Transactions",
  setup: async () => {
    const signer = await buildSigner();
    sandbox = await startSandbox({ family: "evm", network: "arc" }, sandboxVersions("arc"));
    const { node: rpc, indexer: explorer } = sandbox.endpoints;
    if (rpc === undefined || explorer === undefined) {
      throw new Error("the sandbox instance has no node or indexer endpoint");
    }
    blockscout = blockscoutOf(explorer);
    explorerUrl = explorer;

    const info: EvmConfigInfo = {
      status: { type: "active" },
      chainId: 5042,
      name: "Arc",
      unit: { name: "USDC", code: "USDC", magnitude: 18 },
      node: { type: "external", uri: rpc },
      // Blockscout answers the Etherscan API and the internal transactions, as production's does
      explorer: { type: "blockscout", noCache: true, uri: `${explorer}/api` },
      nativeContracts: [ARC_USDC_NATIVE_CONTRACT],
      feeHistoryBlockCount: 1024,
      feeHistoryRewardPercentile: 60,
    };
    LiveConfig.setConfig({
      config_currency_arc: {
        type: "object",
        default: info,
      },
    });

    // The chain preloads no token, and USDC is the one Live knows for Arc: no CAL to ask
    restoreTokens = swapTokens(arc.id, [ARC_USDC]);

    closeGuard = forbidRemoteRequests();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: arc,
      derivationMode: "",
    });

    provider = new ethers.JsonRpcProvider(rpc);

    // The chain starts with the dealer only: the account gets its USDC by airdrop
    await sandbox.airdrop(address, USDC_AIRDROP);
    // The first sync must see the airdrop
    await blockscout.waitForBlock(await provider.getBlockNumber());

    return {
      currencyBridge,
      accountBridge,
      account: makeAccount(address, arc),
    };
  },
  getTransactions: () => makeScenarioTransactions(),
  mockIndexer: async (_account, optimistic) => {
    const receipt = await provider.waitForTransaction(optimistic.hash, 1, 60_000);
    if (receipt === null) throw new Error(`${optimistic.hash} is not in a block after 60 s`);
    await blockscout.waitForBlock(receipt.blockNumber);
    // The explorer reports the native transfer as a transfer of the USDC token `0x36…` too: what Live must not count twice
    const { items } = await (
      await fetch(`${explorerUrl}/api/v2/transactions/${optimistic.hash}/token-transfers`)
    ).json();
    expect(items.map((t: { token: { address_hash: string } }) => t.token.address_hash)).toEqual([
      ethers.getAddress(ARC_USDC_NATIVE_CONTRACT),
    ]);
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
