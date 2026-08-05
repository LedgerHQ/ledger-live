import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import tronCoinConfig from "@ledgerhq/coin-tron/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  TRON,
  TRON_LOCAL_RPC,
  makeTronAccount,
  makeTrc10Token,
  makeTrc20Token,
  registerTronTokensInMockStore,
} from "../fixtures";
import type { TronAccount } from "@ledgerhq/coin-tron/types/index";
import type {
  Transaction as TronTransaction,
  TronFamilySpecificData,
} from "@ledgerhq/live-common/families/tron/types";
import { getBridges } from "../helpers";
import { getPrefundedAccounts, killTronbox, spawnTronbox } from "../tronbox";
import type { PrefundedAccount } from "../tronbox";
import { delegateBandwidth, freezeForDelegation, listWitnessAddresses } from "../stakingFixtures";
import {
  indexBlocks,
  initMswHandlers,
  registerTrc20Contract,
  resetIndexer,
  waitForOperationInclusion,
} from "../indexer";
import { deployTrc20, issueTrc10 } from "../tokenFixtures";
import type { Trc10Asset, Trc20Asset } from "../tokenFixtures";

let closeMsw: (() => void) | null = null;
let funder: PrefundedAccount;
let recipient: PrefundedAccount;
let startBlock = 0;
let trc10: Trc10Asset;
let trc10Token: TokenCurrency;
let trc10SubAccountId = "";
let trc20: Trc20Asset;
let trc20Token: TokenCurrency;
let trc20SubAccountId = "";
let witnessAddress = "";

/** Delegated to `recipient` during setup, so the undelegate row has something to act on. */
const DELEGATED_SUN = 100_000_000; // 100 TRX
const FROZEN_SUN = 50_000_000; // 50 TRX
/** TVM fee_limit for the custom-fee row — comfortably above a TRC-20 transfer's energy cost. */
const CUSTOM_FEE_LIMIT_SUN = 50_000_000; // 50 TRX

/**
 * The transaction the wallet hands the bridge for Tron: the generic shape with `mode` widened to
 * Tron's own. Resource-staking modes are family modes and stay out of `GENERIC_TRANSACTION_MODE` by
 * design, so the generic type alone cannot express the staking rows below.
 */
type TronGenericTransaction = Omit<GenericTransaction, "mode"> & {
  mode?: TronTransaction["mode"];
};
type Tx = ScenarioTransaction<TronGenericTransaction, Account>;

function makeTransactions(): Tx[] {
  const sendTrx: Tx = {
    name: "Send 10 TRX",
    amount: new BigNumber(10_000_000),
    recipient: recipient.address,
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      // Native send fits in the 5000 B/day free bandwidth quota → no TRX burn.
      expect(latestOp.fee).toStrictEqual(new BigNumber(0));
      expect(latestOp.value).toStrictEqual(latestOp.fee.plus(10_000_000));
    },
  };

  const sendTrxWithMemo: Tx = {
    name: "Send 5 TRX with a memo",
    amount: new BigNumber(5_000_000),
    recipient: recipient.address,
    memoType: "memo",
    memoValue: "ledger-e2e",
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);

      // CHARACTERISATION TEST — pins a known defect, not an endorsement: shared `transactionToIntent`
      // emits a pre-Memo-union shape (generic-coin-framework/utils.ts:546-552): `{ type: memoType,
      // value }`, with no `kind`; `craftTransaction.ts:27-28` reads `rawMemo.type === "string" &&
      // rawMemo.kind === "memo"`, false for that shape, so the memo is silently dropped and never
      // reaches the chain (coin-tron declares `StringMemo<"memo">` = `{ type: 'string'; kind: 'memo';
      // value }`). When fixed upstream THIS ASSERTION FAILS — that is the point: flip it to assert
      // the memo survives. A dropped memo also means TRON's 1 TRX `memoFee` is never charged, so the
      // fee here matches a plain send; once it lands, this row's fee expectation must account for it.
      const extra = latestOp.extra as { memo?: string };
      expect(extra.memo).toBeUndefined();
      expect(latestOp.fee).toStrictEqual(new BigNumber(0));
    },
  };

  const sendMaxTrx: Tx = {
    name: "Send max TRX",
    useAllAmount: true,
    recipient: recipient.address,
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      // useAllAmount keeps the fallback estimateFees worst case in reserve
      // (ACTIVATION_FEES = 1.1 TRX). Allow some headroom around that.
      expect(curr.spendableBalance.lt(2_000_000)).toBe(true);
    },
  };

  const sendTrc10: Tx = {
    name: `Send 100 ${trc10.symbol} (TRC10)`,
    amount: new BigNumber(100),
    recipient: recipient.address,
    subAccountId: trc10SubAccountId,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc10SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc10SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual((prevSub?.balance ?? new BigNumber(0)).minus(100));
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      expect(latestOp.fee).toStrictEqual(new BigNumber(0));
    },
  };

  const sendMaxTrc10: Tx = {
    name: `Send max ${trc10.symbol} (TRC10)`,
    useAllAmount: true,
    recipient: recipient.address,
    subAccountId: trc10SubAccountId,
    expect: (_prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc10SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual(new BigNumber(0));
    },
  };

  const sendTrc20: Tx = {
    name: `Send 1 ${trc20.symbol} (TRC20)`,
    amount: new BigNumber(1_000_000),
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual((prevSub?.balance ?? new BigNumber(0)).minus(1_000_000));
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      // No frozen energy → TVM call burns TRX for energy.
      expect(latestOp.fee.gt(0)).toBe(true);
    },
  };

  const sendTrc20WithCustomFees: Tx = {
    name: `Send 1 ${trc20.symbol} (TRC20) with a custom fee limit`,
    amount: new BigNumber(1_000_000),
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    // The only fee override TRON actually honours. `customFees.value` becomes the TVM `fee_limit`
    // (craftTransaction.ts:101 → craftTrc20Transaction), and `prepareTransaction` skips
    // `estimateFees` entirely when it is set. A native TRX or TRC-10 send ignores it — TRON's
    // TransferContract has no sender-specified fee field — so this is the one row that can exercise
    // the custom-fee path against a chain.
    customFees: { parameters: { fees: new BigNumber(CUSTOM_FEE_LIMIT_SUN) } },
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual((prevSub?.balance ?? new BigNumber(0)).minus(1_000_000));

      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      // The transfer succeeded, so the fee_limit covered the energy cost, and the chain never charges
      // more than the limit it was given. Asserting the bound rather than an amount keeps this valid
      // on a devnet that prices energy differently from mainnet.
      expect(latestOp.fee.gt(0)).toBe(true);
      expect(latestOp.fee.lte(CUSTOM_FEE_LIMIT_SUN)).toBe(true);
    },
  };

  const sendMaxTrc20: Tx = {
    name: `Send max ${trc20.symbol} (TRC20)`,
    useAllAmount: true,
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    expect: (_prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual(new BigNumber(0));
    },
  };

  const freeze: Tx = {
    name: "Freeze 50 TRX for BANDWIDTH",
    mode: "freeze",
    amount: new BigNumber(FROZEN_SUN),
    recipient: funder.address,
    familySpecificData: { resource: "BANDWIDTH" } satisfies TronFamilySpecificData,
    expect: (prev, curr) => {
      const prevFrozen =
        (prev as TronAccount).tronResources?.frozen.bandwidth?.amount ?? new BigNumber(0);
      const currFrozen =
        (curr as TronAccount).tronResources?.frozen.bandwidth?.amount ?? new BigNumber(0);
      expect(currFrozen.minus(prevFrozen)).toStrictEqual(new BigNumber(FROZEN_SUN));

      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("FREEZE");
      // Staking moves TRX between the account's own buckets, so it records no native value.
      expect(latestOp.value).toStrictEqual(latestOp.fee);
      // `extra.frozenAmount` proves the familyExtra passthrough and the BigNumber revival in
      // `fromOperationExtraRaw`.
      const extra = latestOp.extra as { frozenAmount?: BigNumber };
      expect(extra.frozenAmount).toStrictEqual(new BigNumber(FROZEN_SUN));
    },
  };

  const vote: Tx = {
    name: "Vote 1 for the devnet witness",
    mode: "vote",
    recipient: funder.address,
    familySpecificData: {
      votes: [{ address: witnessAddress, voteCount: 1, name: null }],
    } satisfies TronFamilySpecificData,
    expect: (_prev, curr) => {
      const votes = (curr as TronAccount).tronResources?.votes ?? [];
      expect(votes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ address: witnessAddress, voteCount: 1 }),
        ]),
      );
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("VOTE");
      expect(latestOp.value).toStrictEqual(latestOp.fee);
    },
  };

  const unfreeze: Tx = {
    name: "Unfreeze 50 TRX of BANDWIDTH",
    mode: "unfreeze",
    amount: new BigNumber(FROZEN_SUN),
    recipient: funder.address,
    familySpecificData: { resource: "BANDWIDTH" } satisfies TronFamilySpecificData,
    expect: (prev, curr) => {
      // Stake 2.0 records the unfreeze as a pending entry; the TRX only returns after
      // UnfreezeDelayDays, whose floor is one real day — no devnet can shorten it, which is why
      // withdrawExpireUnfreeze has no row here.
      const prevPending = (prev as TronAccount).tronResources?.unFrozen.bandwidth ?? [];
      const currPending = (curr as TronAccount).tronResources?.unFrozen.bandwidth ?? [];
      expect(currPending.length).toBeGreaterThan(prevPending.length);

      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("UNFREEZE");
      expect(latestOp.value).toStrictEqual(latestOp.fee);
      const extra = latestOp.extra as { unfreezeAmount?: BigNumber };
      expect(extra.unfreezeAmount).toStrictEqual(new BigNumber(FROZEN_SUN));
    },
  };

  const unDelegate: Tx = {
    name: "Undelegate 100 TRX of BANDWIDTH from the recipient",
    mode: "unDelegateResource",
    amount: new BigNumber(DELEGATED_SUN),
    recipient: recipient.address,
    familySpecificData: { resource: "BANDWIDTH" } satisfies TronFamilySpecificData,
    expect: (prev, curr) => {
      const prevDelegated =
        (prev as TronAccount).tronResources?.delegatedFrozen.bandwidth?.amount ?? new BigNumber(0);
      const currDelegated =
        (curr as TronAccount).tronResources?.delegatedFrozen.bandwidth?.amount ?? new BigNumber(0);
      expect(currDelegated.lt(prevDelegated)).toBe(true);

      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("UNDELEGATE_RESOURCE");
      expect(latestOp.value).toStrictEqual(latestOp.fee);
      const extra = latestOp.extra as { unDelegatedAmount?: BigNumber };
      expect(extra.unDelegatedAmount).toStrictEqual(new BigNumber(DELEGATED_SUN));
    },
  };

  // Ordering is load-bearing:
  //  - `vote` needs tron power, so it must follow `freeze`.
  //  - TRC20 sends burn energy (= TRX), so `sendMaxTrx` must stay last; otherwise the funder no
  //    longer has enough TRX to cover TRC20 fees. `freeze` also locks TRX, which `sendMaxTrx`'s
  //    spendable-balance assertion tolerates.
  return [
    sendTrx,
    sendTrxWithMemo,
    sendTrc10,
    sendMaxTrc10,
    sendTrc20,
    sendTrc20WithCustomFees,
    sendMaxTrc20,
    freeze,
    vote,
    unfreeze,
    unDelegate,
    sendMaxTrx,
  ];
}

export const scenarioTron: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Tron (TRX + TRC10 + TRC20)",

  setup: async () => {
    await spawnTronbox();

    const accounts = await getPrefundedAccounts();
    if (accounts.length < 2) {
      throw new Error("tronbox/tre must expose at least 2 prefunded accounts");
    }
    funder = accounts[0];
    recipient = accounts[1];

    trc10 = await issueTrc10(funder, {
      name: "LedgerTestToken",
      abbr: "LTT",
      totalSupply: 1_000_000_000,
      precision: 0,
    });
    trc20 = await deployTrc20(funder, {
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      initialSupply: 1_000_000_000_000n,
    });
    registerTrc20Contract({
      contractAddress: trc20.contractAddress,
      name: trc20.name,
      symbol: trc20.symbol,
      decimals: trc20.decimals,
    });

    // Stake 2.0 requires the resource be frozen before it can be delegated.
    await freezeForDelegation(funder, 200_000_000);
    await delegateBandwidth(funder, recipient.address, DELEGATED_SUN);
    [witnessAddress] = await listWitnessAddresses();

    trc10Token = makeTrc10Token(trc10);
    trc20Token = makeTrc20Token(trc20);
    registerTronTokensInMockStore(trc10Token, trc20Token);

    const localConfig = {
      status: { type: "active" as const },
      explorer: { url: TRON_LOCAL_RPC },
    };
    tronCoinConfig.setCoinConfig(() => localConfig);
    LiveConfig.setConfig({
      config_currency_tron: { type: "object", default: localConfig },
    });

    const headRes = await fetch(`${TRON_LOCAL_RPC}/wallet/getnowblock`);
    const head = (await headRes.json()) as { block_header: { raw_data: { number: number } } };
    startBlock = head.block_header.raw_data.number;

    closeMsw = initMswHandlers();

    const { currencyBridge, accountBridge } = await getBridges(funder.signer);
    const account = makeTronAccount(funder.address);
    trc10SubAccountId = encodeTokenAccountId(account.id, trc10Token);
    trc20SubAccountId = encodeTokenAccountId(account.id, trc20Token);
    return { currencyBridge, accountBridge, account, retryInterval: 4000, retryLimit: 30 };
  },

  getTransactions: () => makeTransactions() as ScenarioTransaction<GenericTransaction, Account>[],

  beforeSync: async () => {
    if (funder) await indexBlocks([funder.address, recipient.address], startBlock);
  },

  mockIndexer: async (_account, optimistic) => {
    await waitForOperationInclusion(optimistic.hash);
  },

  beforeAll: account => {
    expect(account.currency.id).toBe(TRON.id);
    expect(account.balance.toNumber()).toBeGreaterThanOrEqual(1_000_000_000);
    const subTrc10 = account.subAccounts?.find(s => s.id === trc10SubAccountId);
    expect(subTrc10).toBeDefined();
    expect(subTrc10!.balance.toNumber()).toBe(1_000_000_000);
    const subTrc20 = account.subAccounts?.find(s => s.id === trc20SubAccountId);
    expect(subTrc20).toBeDefined();
    expect(subTrc20!.balance.toNumber()).toBeGreaterThan(0);
  },

  teardown: async () => {
    closeMsw?.();
    closeMsw = null;
    resetIndexer();
    await killTronbox();
  },
};
