import BigNumber from "bignumber.js";
import { getFeeEstimate } from "../network";
import { buildAccount, buildTransaction } from "../test/fixtures";
import type { ApiResponseFeeEstimate } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../network", () => ({ getFeeEstimate: jest.fn() }));

const mockGetFeeEstimate = getFeeEstimate as jest.Mock;

const feeEstimate = (overrides: Partial<ApiResponseFeeEstimate> = {}): ApiResponseFeeEstimate =>
  ({
    lowBuckets: [{ feerate: 1, estimatedSeconds: 30 }],
    normalBuckets: [{ feerate: 2, estimatedSeconds: 10 }],
    priorityBucket: { feerate: 5, estimatedSeconds: 1 },
    ...overrides,
  }) as ApiResponseFeeEstimate;

const summarize = (networkInfo: { label: string; amount: BigNumber; estimatedSeconds: number }[]) =>
  networkInfo.map(info => ({
    label: info.label,
    amount: info.amount.toString(),
    estimatedSeconds: info.estimatedSeconds,
  }));

describe("prepareTransaction", () => {
  beforeEach(() => {
    mockGetFeeEstimate.mockReset();
    mockGetFeeEstimate.mockResolvedValue(feeEstimate());
  });

  it("maps the fee estimate buckets to the slow, medium and fast network fees", async () => {
    const prepared = await prepareTransaction(buildAccount(), buildTransaction());

    expect(summarize(prepared.networkInfo)).toEqual([
      { label: "slow", amount: "1", estimatedSeconds: 30 },
      { label: "medium", amount: "2", estimatedSeconds: 10 },
      { label: "fast", amount: "5", estimatedSeconds: 1 },
    ]);
  });

  it("falls back to a fee rate of 1 when the low and normal buckets are empty", async () => {
    mockGetFeeEstimate.mockResolvedValue(feeEstimate({ lowBuckets: [], normalBuckets: [] }));

    const prepared = await prepareTransaction(buildAccount(), buildTransaction());

    expect(prepared.networkInfo.map(info => info.amount.toString())).toEqual(["1", "1", "5"]);
  });

  it("keeps the selected fee strategy when the buckets have different estimated times", async () => {
    const prepared = await prepareTransaction(
      buildAccount(),
      buildTransaction({ feesStrategy: "slow" }),
    );

    expect(prepared.feesStrategy).toBe("slow");
  });

  it("forces the fast strategy when every bucket has the same estimated time", async () => {
    mockGetFeeEstimate.mockResolvedValue(
      feeEstimate({
        lowBuckets: [{ feerate: 1, estimatedSeconds: 1 }],
        normalBuckets: [{ feerate: 2, estimatedSeconds: 1 }],
        priorityBucket: { feerate: 5, estimatedSeconds: 1 },
      }),
    );

    const prepared = await prepareTransaction(
      buildAccount(),
      buildTransaction({ feesStrategy: "slow" }),
    );

    expect(prepared.feesStrategy).toBe("fast");
  });

  it("does not override a custom fee strategy when every bucket has the same estimated time", async () => {
    mockGetFeeEstimate.mockResolvedValue(
      feeEstimate({
        lowBuckets: [{ feerate: 1, estimatedSeconds: 1 }],
        normalBuckets: [{ feerate: 2, estimatedSeconds: 1 }],
        priorityBucket: { feerate: 5, estimatedSeconds: 1 },
      }),
    );

    const prepared = await prepareTransaction(buildAccount(), buildTransaction());

    expect(prepared.feesStrategy).toBe("custom");
  });

  it("returns the same result when an already prepared transaction is prepared again or in parallel", async () => {
    const account = buildAccount();
    const transaction = buildTransaction({ feesStrategy: "medium" });

    const first = await prepareTransaction(account, { ...transaction });
    const second = await prepareTransaction(account, { ...first });
    const [parallelA, parallelB] = await Promise.all([
      prepareTransaction(account, { ...transaction }),
      prepareTransaction(account, { ...first }),
    ]);

    expect([second, parallelA, parallelB]).toEqual([first, first, first]);
  });
});
