import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import tronCoinConfig from "@ledgerhq/coin-tron/config";
import { DEFAULT_TRC20_FEES_LIMIT } from "@ledgerhq/coin-tron/network";
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
  setEnergyLimitOverride,
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
/**
 * TVM fee_limit for the custom-fee row. Deliberately above `DEFAULT_TRC20_FEES_LIMIT`, so this row
 * lands on the branch where the supplied value wins the ceiling rather than the one where crafting
 * raises it — and comfortably above a TRC-20 transfer's actual energy cost either way.
 */
const CUSTOM_FEE_LIMIT_SUN = 100_000_000; // 100 TRX
/**
 * A custom fee limit *below* `DEFAULT_TRC20_FEES_LIMIT` (50 TRX), for the LIVE-36391 regression guard
 * row. Comfortably above a TRC-20 transfer's actual energy cost so the transfer still succeeds (the
 * balance-delta assertions stay valid), but below the default so a reintroduced floor would raise it —
 * which the on-chain `fee_limit` readback catches.
 */
const BELOW_DEFAULT_FEE_LIMIT_SUN = 30_000_000; // 30 TRX
/** tx hash → on-chain `fee_limit`, recorded by `mockIndexer` for the guard row to assert against. */
const onChainFeeLimitByHash = new Map<string, number | undefined>();
/**
 * Energy the indexer mock reports for the energy-covered row — large enough to dwarf a TRC-20
 * transfer's cost, so `estimateFees` nets the fee to 0. Reproduces the mainnet USDT-holder state the
 * devnet can't credit on-chain (see `setEnergyLimitOverride`).
 */
const COVERED_ENERGY = 1_000_000_000; // 1e9 energy

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

      // The memo survives end-to-end (LIVE-35735): shared `transactionToIntent` emits the framework's
      // `StringMemo`, `craftSend` writes it into `raw_data.data`, and sync decodes it back onto `extra.memo`.
      const extra = latestOp.extra as { memo?: string };
      expect(extra.memo).toBe("ledger-e2e");
      // TIP-387's memo fee is a chain parameter left at its 0 default on the devnet, and a native send
      // fits the free bandwidth quota — so the memo costs nothing here, and `estimateFees` reads the
      // same 0 from the chain, keeping estimate and actual in agreement.
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
      // LIVE-36865: with no fee override the crafted `fee_limit` is the DEFAULT ceiling, never the
      // display estimate — which the migration wrongly piped into it.
      expect(onChainFeeLimitByHash.get(latestOp.hash)).toBe(DEFAULT_TRC20_FEES_LIMIT);
    },
  };

  const sendTrc20WithCustomFees: Tx = {
    name: `Send 1 ${trc20.symbol} (TRC20) with a custom fee limit`,
    amount: new BigNumber(1_000_000),
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    // The only fee override TRON actually honours: crafting turns it into the TVM `fee_limit`, and
    // `prepareTransaction` skips `estimateFees` entirely when it is set. A native TRX or TRC-10 send
    // ignores it — TRON's TransferContract has no sender-specified fee field — so this is the one row
    // that can exercise the custom-fee path against a chain.
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

  const sendTrc20WithBelowDefaultFee: Tx = {
    name: `Send 1 ${trc20.symbol} (TRC20) with a below-default custom fee limit`,
    amount: new BigNumber(1_000_000),
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    // LIVE-36391 regression guard: the below-default cap must reach the chain verbatim, not be floored
    // to the default. The on-chain `fee_limit` readback (from mockIndexer) proves the override survived
    // craft → sign → broadcast through the shipping generic-coin-framework bridge.
    customFees: { parameters: { fees: new BigNumber(BELOW_DEFAULT_FEE_LIMIT_SUN) } },
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual((prevSub?.balance ?? new BigNumber(0)).minus(1_000_000));

      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      expect(onChainFeeLimitByHash.get(latestOp.hash)).toBe(BELOW_DEFAULT_FEE_LIMIT_SUN);
    },
  };

  const freezeEnergy: Tx = {
    name: "Freeze 50 TRX for ENERGY",
    mode: "freeze",
    amount: new BigNumber(FROZEN_SUN),
    recipient: funder.address,
    familySpecificData: { resource: "ENERGY" } satisfies TronFamilySpecificData,
    expect: (prev, curr) => {
      // From here on the account holds staked energy. The devnet meters energy differently from mainnet,
      // so make the wallet see it as fully covered for the next row — reproducing the mainnet USDT-holder
      // state on-chain devnet data alone can't provide. Set first so it survives an expect retry.
      setEnergyLimitOverride(COVERED_ENERGY);

      const prevFrozen =
        (prev as TronAccount).tronResources?.frozen.energy?.amount ?? new BigNumber(0);
      const currFrozen =
        (curr as TronAccount).tronResources?.frozen.energy?.amount ?? new BigNumber(0);
      expect(currFrozen.minus(prevFrozen)).toStrictEqual(new BigNumber(FROZEN_SUN));

      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("FREEZE");
      expect(latestOp.value).toStrictEqual(latestOp.fee);
    },
  };

  const sendTrc20FromEnergyCovered: Tx = {
    name: `Send 1 ${trc20.symbol} (TRC20) from an energy-covered account`,
    amount: new BigNumber(1_000_000),
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    // LIVE-36865 regression guard. With energy mocked as covered, `estimateFees` nets the display fee to
    // 0 — the exact state the generic-adapter migration crafted `fee_limit: 0` from, reverting
    // OUT_OF_ENERGY on-chain. With no fee override the crafted `fee_limit` must instead be the DEFAULT
    // ceiling (the on-chain readback proves it), and the transfer must still land.
    expect: (prev, curr) => {
      // Restore real energy reporting for the remaining rows. Set first so it survives an expect retry.
      setEnergyLimitOverride(null);

      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual((prevSub?.balance ?? new BigNumber(0)).minus(1_000_000));

      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      expect(onChainFeeLimitByHash.get(latestOp.hash)).toBe(DEFAULT_TRC20_FEES_LIMIT);
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
  //  - `freezeEnergy` flips the indexer's energy-covered mock on, so `sendTrc20FromEnergyCovered` must
  //    directly follow it; that row flips the mock back off. Both must precede `sendMaxTrc20`, which
  //    empties the TRC20 balance they spend from.
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
    sendTrc20WithBelowDefaultFee,
    freezeEnergy,
    sendTrc20FromEnergyCovered,
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
    // Record each broadcast transaction's on-chain `fee_limit` so the LIVE-36391 guard row can assert
    // the custom value reached the chain (non-TRC-20 sends carry none; the guard reads only its own tx).
    // Records `undefined` rather than throwing on any lookup failure — a rejected fetch, a non-2xx,
    // or bad JSON. This runs for every row, so a blip must not fail unrelated ones; a miss surfaces
    // as the guard row's own assertion instead.
    let feeLimit: number | undefined;
    try {
      const res = await fetch(`${TRON_LOCAL_RPC}/wallet/gettransactionbyid`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: optimistic.hash }),
      });
      const tx = res.ok ? ((await res.json()) as { raw_data?: { fee_limit?: number } }) : undefined;
      feeLimit = tx?.raw_data?.fee_limit;
    } catch {
      feeLimit = undefined;
    }
    onChainFeeLimitByHash.set(optimistic.hash, feeLimit);
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
    onChainFeeLimitByHash.clear();
    await killTronbox();
  },
};
