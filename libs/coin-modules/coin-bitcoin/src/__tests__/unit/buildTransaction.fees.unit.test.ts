import { BigNumber } from "bignumber.js";
import { bitcoinPickingStrategy } from "../../types";

// --------- MOCK ./wallet-btc  ---------
const estimateAccountMaxSpendable = jest.fn().mockResolvedValue(new BigNumber(123456));
const buildAccountTx = jest.fn().mockResolvedValue({ fee: 999, inputs: [], outputs: [] });

// swap-able explorer for each test
let currentExplorer: any = {
  getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00001000" }), // 1 sat/vB
};

jest.mock("../../wallet-btc", () => {
  class DummyStrategy {
    constructor(..._args: any[]) {}
  }
  return {
    __esModule: true,
    default: {
      estimateAccountMaxSpendable: (...args: any[]) => estimateAccountMaxSpendable(...args),
      buildAccountTx: (...args: any[]) => buildAccountTx(...args),
    },
    getWalletAccount: jest.fn((_account: any) => ({
      xpub: { explorer: currentExplorer, crypto: {} },
      derivationMode: "native_segwit",
    })),
    CoinSelect: DummyStrategy,
    DeepFirst: DummyStrategy,
    Merge: DummyStrategy,
  };
});

import { buildTransaction } from "../../buildTransaction";

const BN = (v: BigNumber.Value) => new BigNumber(v);
const setExplorer = (exp: any) => {
  currentExplorer = exp;
};

function makeAccount(currencyId = "bitcoin") {
  return { id: "acc_1", currency: { id: currencyId } } as any;
}
function makeTx(feePerByte: BigNumber.Value, overrides: Partial<any> = {}) {
  return {
    recipient: "bc1qexampleaddressxxxxxxxxxxxxxxxxxxxxxx",
    amount: BN(10000),
    useAllAmount: false,
    feePerByte: BN(feePerByte),
    rbf: true,
    opReturnData: undefined,
    utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
    ...overrides,
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  // default explorer floor = 1 sat/vB
  setExplorer({ getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00001000" }) });
});

// === NO CLAMPING IN buildTransaction) ===

test("passes user fee 1 sat/vB through unchanged (relay=1)", async () => {
  const account = makeAccount();
  const tx = makeTx(1);
  await buildTransaction(account, tx);

  const fee1 = estimateAccountMaxSpendable.mock.calls[0][1]; // number
  const fee2 = buildAccountTx.mock.calls[0][0].feePerByte as number; // number
  expect(fee1).toBe(1);
  expect(fee2).toBe(1);
});

test("passes user fee already above floor through unchanged (relay=1, user=3)", async () => {
  const account = makeAccount();
  const tx = makeTx(3);
  await buildTransaction(account, tx);

  expect(estimateAccountMaxSpendable.mock.calls[0][1]).toBe(3);
  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(3);
});

test("passes fractional fee through unchanged (user=1.2, relay=1)", async () => {
  const account = makeAccount();
  const tx = makeTx(1.2);
  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(1.2);
});

test("ignores higher relay floor when not clamping (relay=2, user=1 → still 1)", async () => {
  setExplorer({ getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00002000" }) }); // =2 sat/vB
  const account = makeAccount();
  const tx = makeTx(1);
  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(1);
});

test("ignores higher relay floor when not clamping (relay=2, user=1.2 → still 1.2)", async () => {
  setExplorer({ getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00002000" }) }); // =2 sat/vB
  const account = makeAccount();
  const tx = makeTx(1.2);
  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(1.2);
});

test("no clamp on explorer error (user=1 → 1)", async () => {
  setExplorer({ getNetwork: jest.fn().mockRejectedValue(new Error("boom")) });
  const account = makeAccount();
  const tx = makeTx(1);
  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(1);
});

test("no clamp on tiny relay floor (user=1 stays 1)", async () => {
  setExplorer({ getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00000050" }) }); // ~0.05 sat/vB
  const account = makeAccount();
  const tx = makeTx(1);
  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(1);
});

test("throws when feePerByte is missing", async () => {
  const account = makeAccount();
  await expect(
    buildTransaction(account, { ...makeTx(1), feePerByte: null } as any),
  ).rejects.toThrow(); // FeeNotLoaded
});
