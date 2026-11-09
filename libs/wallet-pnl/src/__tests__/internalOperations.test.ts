import BigNumber from "bignumber.js";
import { computeAssetPnL } from "../assetPnL";
import { getCostBasis, invalidatePnLCache } from "../costBasisCache";
import { makeAccount } from "../scenarios/accounts";
import { ETH, USD, WEI } from "../scenarios/currencies";
import { makeOp, resetOperationIdCounter } from "../scenarios/operations";
import { buildCV, dailyHistory } from "@domain/entity-market-countervalues/mock";
import { expectBN } from "./helpers/bn";

const INTERNAL_RECEIVE_DATE = new Date(Date.UTC(2025, 0, 15));
const HISTORICAL_PRICE = 2000;
const LATEST_PRICE = 2400;

beforeEach(() => {
  invalidatePnLCache();
  resetOperationIdCounter();
});

function buildCountervalues() {
  return buildCV({
    pair: { from: ETH, to: USD },
    history: dailyHistory([[INTERNAL_RECEIVE_DATE, HISTORICAL_PRICE]]),
    latest: LATEST_PRICE,
  });
}

function parentWithInternalReceive(id: string, date: Date) {
  return makeOp({
    id: "parent",
    type: "FEES",
    date: INTERNAL_RECEIVE_DATE,
    internalOperations: [makeOp({ id, type: "IN", value: WEI, date })],
  });
}

describe("cost basis internal operations", () => {
  it("should value an internal receive at its operation-date rate without reconciliation", () => {
    const account = makeAccount(ETH, {
      balance: WEI,
      operations: [parentWithInternalReceive("internal-receive", INTERNAL_RECEIVE_DATE)],
    });

    const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

    expect(pnl.reconciliation.isClean).toBe(true);
    expect(pnl.reconciliation.applied).toBe(false);
    expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber(200_000), 0);
    expectBN(pnl.unrealisedPnL).toBeCloseToBN(new BigNumber(40_000), 0);
  });

  it("should invalidate the cache when a parent gains an internal receive", () => {
    const countervalues = buildCountervalues();
    const initialAccount = makeAccount(ETH, {
      balance: WEI,
      operations: [parentWithInternalReceive("internal-receive", INTERNAL_RECEIVE_DATE)],
    });
    const updatedAccount = {
      ...initialAccount,
      balance: WEI.times(2),
      operations: [
        {
          ...initialAccount.operations[0],
          internalOperations: [
            ...initialAccount.operations[0].internalOperations!,
            makeOp({
              id: "later-internal-receive",
              type: "IN",
              value: WEI,
              date: INTERNAL_RECEIVE_DATE,
            }),
          ],
        },
      ],
    };

    const before = getCostBasis(initialAccount, USD, countervalues);
    const after = getCostBasis(updatedAccount, USD, countervalues);

    expect(after).not.toBe(before);
    expectBN(after.totalAmount).toEqualBN(WEI.times(2));
    expectBN(after.totalCostInCounterValue).toBeCloseToBN(new BigNumber(400_000), 0);
  });

  it("should not include internal outflows", () => {
    const account = makeAccount(ETH, {
      balance: WEI,
      operations: [
        makeOp({
          id: "parent",
          type: "IN",
          value: WEI,
          date: INTERNAL_RECEIVE_DATE,
          internalOperations: [
            makeOp({
              id: "internal-outflow",
              type: "OUT",
              value: WEI,
              date: INTERNAL_RECEIVE_DATE,
            }),
          ],
        }),
      ],
    });

    const pnl = computeAssetPnL(account, buildCountervalues(), USD)!;

    expect(pnl.reconciliation.isClean).toBe(true);
    expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber(200_000), 0);
  });
});
