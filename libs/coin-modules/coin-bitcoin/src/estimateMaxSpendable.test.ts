// libs/coin-modules/coin-bitcoin/src/estimateMaxSpendable.test.ts
import { BigNumber } from "bignumber.js";

// ---------- Mocks (paths must match imports inside estimateMaxSpendable.ts) ----------
const estimateAccountMaxSpendable = jest.fn().mockResolvedValue(new BigNumber(123456));

// swap-able explorer for each test (no longer affects result since we don't clamp here)
let currentExplorer: any = {
  getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00001000" }), // 1 sat/vB
};

jest.mock("./wallet-btc", () => ({
  __esModule: true,
  default: {
    estimateAccountMaxSpendable: (...args: any[]) => estimateAccountMaxSpendable(...args),
  },
  getWalletAccount: jest.fn((_account: any) => ({
    xpub: { explorer: currentExplorer },
  })),
}));

// When tx.feePerByte is undefined, estimateMaxSpendable calls this:
const getAccountNetworkInfo = jest.fn().mockResolvedValue({
  feeItems: { defaultFeePerByte: new BigNumber(1) },
});
jest.mock("./getAccountNetworkInfo", () => ({
  __esModule: true,
  getAccountNetworkInfo: (...args: any[]) => getAccountNetworkInfo(...args),
}));

// Make getMainAccount a no-op passthrough
jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  __esModule: true,
  getMainAccount: (a: any) => a,
}));

// ---------- SUT ----------
import estimateMaxSpendable from "./estimateMaxSpendable";
import type { Transaction } from "./types";

const BN = (v: BigNumber.Value) => new BigNumber(v);
const setExplorer = (exp: any) => {
  currentExplorer = exp;
};

function makeAccount(currencyId = "bitcoin") {
  return { id: "acc_1", currency: { id: currencyId } } as any;
}

function makeTx(feePerByte?: BigNumber.Value, overrides: Partial<Transaction> = {}) {
  return {
    amount: BN(10000),
    recipient: "bc1qexample...",
    useAllAmount: false,
    feePerByte: feePerByte !== undefined ? BN(feePerByte) : undefined,
    utxoStrategy: { strategy: 2, excludeUTXOs: [] }, // OPTIMIZE_SIZE (value doesn't matter here)
    rbf: true,
    opReturnData: undefined,
    ...overrides,
  } as any as Transaction;
}

beforeEach(() => {
  jest.clearAllMocks();
  setExplorer({ getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00001000" }) });
  estimateAccountMaxSpendable.mockResolvedValue(new BigNumber(123456));
  getAccountNetworkInfo.mockResolvedValue({
    feeItems: { defaultFeePerByte: new BigNumber(1) },
  });
});

test("passes manual 1 sat/vB through unchanged", async () => {
  const account = makeAccount();
  const tx = makeTx(1);

  await estimateMaxSpendable({ account, parentAccount: undefined, transaction: tx });

  const feeArg = estimateAccountMaxSpendable.mock.calls[0][1]; // number
  expect(feeArg).toBe(1);
});

test("passes user fee already above floor through unchanged (user=3)", async () => {
  const account = makeAccount();
  const tx = makeTx(3);

  await estimateMaxSpendable({ account, parentAccount: undefined, transaction: tx });

  const feeArg = estimateAccountMaxSpendable.mock.calls[0][1];
  expect(feeArg).toBe(3);
});

test("passes fractional fee through unchanged (user=1.2)", async () => {
  const account = makeAccount();
  const tx = makeTx(1.2);

  await estimateMaxSpendable({ account, parentAccount: undefined, transaction: tx });

  const feeArg = estimateAccountMaxSpendable.mock.calls[0][1];
  expect(feeArg).toBe(1.2);
});

test("ignores higher relay floor when not clamping (relay≈2, user=1 → still 1)", async () => {
  setExplorer({ getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00002000" }) });
  const account = makeAccount();
  const tx = makeTx(1);

  await estimateMaxSpendable({ account, parentAccount: undefined, transaction: tx });

  const feeArg = estimateAccountMaxSpendable.mock.calls[0][1];
  expect(feeArg).toBe(1);
});

test("no clamp on explorer error (user=1 → 1)", async () => {
  setExplorer({ getNetwork: jest.fn().mockRejectedValue(new Error("boom")) });
  const account = makeAccount();
  const tx = makeTx(1);

  await estimateMaxSpendable({ account, parentAccount: undefined, transaction: tx });

  const feeArg = estimateAccountMaxSpendable.mock.calls[0][1];
  expect(feeArg).toBe(1);
});

test("uses defaultFeePerByte from getAccountNetworkInfo when tx.feePerByte is missing (no clamp)", async () => {
  // defaultFeePerByte = 1 (mocked above)
  const account = makeAccount();
  const tx = makeTx(undefined);

  await estimateMaxSpendable({ account, parentAccount: undefined, transaction: tx });

  expect(getAccountNetworkInfo).toHaveBeenCalled();
  const feeArg = estimateAccountMaxSpendable.mock.calls[0][1];
  expect(feeArg).toBe(1);
});

test("returns 0 when wallet estimator returns negative", async () => {
  estimateAccountMaxSpendable.mockResolvedValueOnce(new BigNumber(-123));
  const account = makeAccount();
  const tx = makeTx(2);

  const res = await estimateMaxSpendable({ account, parentAccount: undefined, transaction: tx });

  expect(res.isEqualTo(0)).toBe(true);
});
