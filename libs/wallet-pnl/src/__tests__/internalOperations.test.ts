import BigNumber from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import { buildCV, dailyHistory } from "@domain/entity-market-countervalues/mock";
import { computeAssetPnL } from "../assetPnL";
import { initialCostBasisState, reduceCostBasis } from "../costBasis";
import { getCostBasis, invalidatePnLCache } from "../costBasisCache";
import { getCostBasisOperations } from "../costBasisOperations";
import { makeAccount } from "../scenarios/accounts";
import { ETH, EUR, USD, WEI } from "../scenarios/currencies";
import { buy, makeOp, resetOperationIdCounter } from "../scenarios/operations";
import { expectBN } from "./helpers/bn";

const EARLIER_DATE = new Date(Date.UTC(2025, 0, 1));
const RECEIVE_DATE = new Date(Date.UTC(2025, 0, 15));
const LATER_DATE = new Date(Date.UTC(2025, 1, 1));
const EARLIER_PRICE = 1000;
const HISTORICAL_PRICE = 2000;
const LATEST_PRICE = 2400;
const CENTS_PER_USD = 100;
const ONE_ETH_HISTORICAL_CENTS = HISTORICAL_PRICE * CENTS_PER_USD;
const ONE_ETH_UNREALISED_CENTS = (LATEST_PRICE - HISTORICAL_PRICE) * CENTS_PER_USD;
const HALF_ETH = WEI.div(2);

beforeEach(() => {
  invalidatePnLCache();
  resetOperationIdCounter();
});

function buildCountervalues() {
  return buildCV({
    pair: { from: ETH, to: USD },
    history: dailyHistory([
      [EARLIER_DATE, EARLIER_PRICE],
      [RECEIVE_DATE, HISTORICAL_PRICE],
      [LATER_DATE, HISTORICAL_PRICE],
    ]),
    latest: LATEST_PRICE,
  });
}

function internalInflow(id: string, hash: string, value: BigNumber): Operation {
  return makeOp({ id, hash, type: "IN", value, date: RECEIVE_DATE });
}

function parentWithInternals(
  id: string,
  hash: string,
  internals: Operation[],
  type: "NONE" | "IN" | "OUT" | "FEES" = "NONE",
  value: BigNumber | number = 0,
): Operation {
  return makeOp({
    id,
    hash,
    type,
    value,
    date: RECEIVE_DATE,
    internalOperations: internals,
  });
}

function withInternalReceive(account: Account, receive: Operation): Account {
  const [parent, ...others] = account.operations;
  return {
    ...account,
    operations: [
      { ...parent, internalOperations: [...(parent.internalOperations ?? []), receive] },
      ...others,
    ],
  };
}

function holdingSentWithRefund(): Account {
  return makeAccount(ETH, {
    balance: HALF_ETH,
    operations: [
      buy(WEI, EARLIER_DATE),
      parentWithInternals(
        "z-send-out",
        "0xrefund",
        [internalInflow("a-refund-in", "0xrefund", HALF_ETH)],
        "OUT",
        WEI,
      ),
    ],
  });
}

describe("cost basis internal receives", () => {
  describe("valuation", () => {
    it("should value an internal receive at its operation-date rate without reconciliation", () => {
      const account = makeAccount(ETH, {
        balance: WEI,
        operations: [
          parentWithInternals("fee-parent", "0xreceive", [
            internalInflow("internal-receive", "0xreceive", WEI),
          ]),
        ],
      });

      const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expect(pnl.reconciliation.applied).toBe(false);
      expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber(ONE_ETH_HISTORICAL_CENTS), 0);
      expectBN(pnl.unrealisedPnL).toBeCloseToBN(new BigNumber(ONE_ETH_UNREALISED_CENTS), 0);
    });

    it("should leave a token transfer filed as an internal operation out of the native cost basis", () => {
      const hash = "0xtoken";
      const account = makeAccount(ETH, {
        balance: WEI,
        operations: [
          parentWithInternals("fee-parent", hash, [
            makeOp({
              id: "token-in",
              hash,
              type: "IN",
              value: WEI.times(50),
              date: RECEIVE_DATE,
              extra: { assetReference: "usdt", assetOwner: "0xowner" },
            }),
            internalInflow("eth-in", hash, WEI),
          ]),
        ],
      });

      const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expectBN(pnl.reconciliation.recordedAmount).toEqualBN(WEI);
      expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber(ONE_ETH_HISTORICAL_CENTS), 0);
    });

    it("should not include internal outflows", () => {
      const hash = "0xout";
      const account = makeAccount(ETH, {
        balance: WEI,
        operations: [
          parentWithInternals(
            "parent-in",
            hash,
            [makeOp({ id: "internal-out", hash, type: "OUT", value: WEI, date: RECEIVE_DATE })],
            "IN",
            WEI,
          ),
        ],
      });

      const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber(ONE_ETH_HISTORICAL_CENTS), 0);
      expectBN(pnl.unrealisedPnL).toBeCloseToBN(new BigNumber(ONE_ETH_UNREALISED_CENTS), 0);
    });

    it("should ignore a failed internal receive", () => {
      const account = makeAccount(ETH, {
        balance: new BigNumber(0),
        operations: [
          parentWithInternals("parent", "0xfailed", [
            makeOp({
              id: "failed-in",
              hash: "0xfailed",
              type: "IN",
              value: WEI,
              date: RECEIVE_DATE,
              hasFailed: true,
            }),
          ]),
        ],
      });

      const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expectBN(pnl.reconciliation.recordedAmount).toEqualBN(0);
      expectBN(pnl.costBasis).toEqualBN(0);
    });

    it("should not price nft operations as native inflows", () => {
      const parent = parentWithInternals("parent-in", "0xnft", [], "IN", WEI);
      parent.nftOperations = [
        makeOp({ id: "nft-in", hash: "0xnft", type: "NFT_IN", value: WEI, date: RECEIVE_DATE }),
      ];
      const account = makeAccount(ETH, { balance: WEI, operations: [parent] });

      const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expectBN(pnl.reconciliation.recordedAmount).toEqualBN(WEI);
    });
  });

  describe("shared internal lists", () => {
    it("should count a list shared by both parents once, including receives with the same legacy id", () => {
      const hash = "0xself";
      const sharedLegacyId = "acc-0xself-IN";
      const internals = [
        internalInflow(sharedLegacyId, hash, WEI),
        internalInflow(sharedLegacyId, hash, WEI.times(3)),
      ];
      const account = makeAccount(ETH, {
        balance: WEI.times(4),
        operations: [
          parentWithInternals("parent-out", hash, internals, "OUT"),
          parentWithInternals("parent-in", hash, internals, "IN"),
        ],
      });

      const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expectBN(pnl.reconciliation.recordedAmount).toEqualBN(WEI.times(4));
      expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber(ONE_ETH_HISTORICAL_CENTS * 4), 0);
    });

    it("should count receives of different transactions that share an index", () => {
      const account = makeAccount(ETH, {
        balance: WEI.times(2),
        operations: [
          parentWithInternals("parent-a", "0xa", [internalInflow("in-a", "0xa", WEI)]),
          parentWithInternals("parent-b", "0xb", [internalInflow("in-b", "0xb", WEI)]),
        ],
      });

      const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expectBN(pnl.reconciliation.recordedAmount).toEqualBN(WEI.times(2));
    });

    it("should sort a shared receive after the last parent that carries it", () => {
      const hash = "0xself";
      const internals = [internalInflow("a-shared-in", hash, WEI)];
      const account = makeAccount(ETH, {
        operations: [
          parentWithInternals("z-parent-in", hash, internals, "IN"),
          parentWithInternals("m-parent-out", hash, internals, "OUT"),
        ],
      });

      const ids = getCostBasisOperations(account).operations.map(({ id }) => id);

      expect(ids.indexOf("z-parent-in:internal-0")).toBeGreaterThan(ids.indexOf("z-parent-in"));
      expect(ids).toHaveLength(3);
    });
  });

  describe("ordering", () => {
    it("should apply a same-date internal refund after its outgoing parent", () => {
      const pnl = computeAssetPnL(holdingSentWithRefund(), buildCountervalues(), USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expectBN(pnl.realisedPnL).toBeCloseToBN(new BigNumber(1000 * CENTS_PER_USD), 0);
      expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber(ONE_ETH_HISTORICAL_CENTS / 2), 0);
    });

    it("should leave the state untouched when the same operations are replayed", () => {
      const account = holdingSentWithRefund();
      const { operations } = getCostBasisOperations(account);
      const countervalues = buildCountervalues();

      const first = reduceCostBasis(initialCostBasisState, operations, account, countervalues, USD);
      const replayed = reduceCostBasis(first, operations, account, countervalues, USD);

      expect(replayed).toBe(first);
      expectBN(first.totalAmount).toEqualBN(HALF_ETH);
    });

    it("should resume from a bookmark to the state of a full replay", () => {
      const account = holdingSentWithRefund();
      const grown = { ...account, operations: [...account.operations, buy(WEI, LATER_DATE)] };
      const countervalues = buildCountervalues();

      const first = reduceCostBasis(
        initialCostBasisState,
        getCostBasisOperations(account).operations,
        account,
        countervalues,
        USD,
      );
      const resumed = reduceCostBasis(
        first,
        getCostBasisOperations(grown).operations,
        grown,
        countervalues,
        USD,
      );
      const full = reduceCostBasis(
        initialCostBasisState,
        getCostBasisOperations(grown).operations,
        grown,
        countervalues,
        USD,
      );

      expect(resumed).not.toBe(first);
      expectBN(resumed.totalAmount).toEqualBN(full.totalAmount);
      expectBN(resumed.totalCostInCounterValue).toEqualBN(full.totalCostInCounterValue);
      expectBN(resumed.realisedPnL).toEqualBN(full.realisedPnL);
    });
  });

  describe("cache", () => {
    const initialAccount = () =>
      makeAccount(ETH, {
        balance: WEI,
        operations: [
          parentWithInternals("fee-parent", "0xreceive", [
            internalInflow("internal-receive", "0xreceive", WEI),
          ]),
        ],
      });

    it("should recompute when a parent gains an internal receive", () => {
      const countervalues = buildCountervalues();
      const account = initialAccount();
      const updated = {
        ...withInternalReceive(account, internalInflow("later-receive", "0xreceive", WEI)),
        balance: WEI.times(2),
      };

      const before = getCostBasis(account, USD, countervalues);
      const after = getCostBasis(updated, USD, countervalues);

      expect(after).not.toBe(before);
      expectBN(after.totalAmount).toEqualBN(WEI.times(2));
      expectBN(after.totalCostInCounterValue).toBeCloseToBN(
        new BigNumber(ONE_ETH_HISTORICAL_CENTS * 2),
        0,
      );
    });

    describe("when a receive is corrected without changing the operation count", () => {
      const accountWithReceive = (receive: Operation, balance: BigNumber) =>
        makeAccount(ETH, {
          balance,
          operations: [
            makeOp({
              id: "parent",
              hash: "0xreceive",
              type: "NONE",
              value: 0,
              date: LATER_DATE,
              internalOperations: [receive],
            }),
          ],
        });

      it("should reprice when the received value is corrected", () => {
        const countervalues = buildCountervalues();
        const original = accountWithReceive(internalInflow("receive", "0xreceive", WEI), WEI);
        const corrected = accountWithReceive(
          internalInflow("receive", "0xreceive", HALF_ETH),
          HALF_ETH,
        );

        const before = getCostBasis(original, USD, countervalues);
        const after = getCostBasis(corrected, USD, countervalues);

        expect(after).not.toBe(before);

        expectBN(after.totalAmount).toEqualBN(HALF_ETH);
        expectBN(after.totalCostInCounterValue).toBeCloseToBN(
          new BigNumber(ONE_ETH_HISTORICAL_CENTS / 2),
          0,
        );
      });

      it("should reprice when the receive date is corrected", () => {
        const countervalues = buildCountervalues();
        const original = accountWithReceive(internalInflow("receive", "0xreceive", WEI), WEI);
        const corrected = accountWithReceive(
          makeOp({ id: "receive", hash: "0xreceive", type: "IN", value: WEI, date: EARLIER_DATE }),
          WEI,
        );

        const before = getCostBasis(original, USD, countervalues);
        const after = getCostBasis(corrected, USD, countervalues);

        expect(after).not.toBe(before);

        expectBN(after.totalCostInCounterValue).toBeCloseToBN(
          new BigNumber(EARLIER_PRICE * CENTS_PER_USD),
          0,
        );
      });
    });

    it("should drop the superseded entry of that fiat and keep the other fiat", () => {
      const countervalues = buildCountervalues();
      const account = initialAccount();
      const updated = withInternalReceive(
        account,
        internalInflow("later-receive", "0xreceive", WEI),
      );

      const usdBefore = getCostBasis(account, USD, countervalues);
      const eurBefore = getCostBasis(account, EUR, countervalues);
      getCostBasis(updated, USD, countervalues);

      expect(getCostBasis(account, USD, countervalues)).not.toBe(usdBefore);
      expect(getCostBasis(account, EUR, countervalues)).toBe(eurBefore);
    });
  });
});
