import { BigNumber } from "bignumber.js";
import { bitcoinPickingStrategy } from "../../types";

// --------- MOCK ./wallet-btc  ---------
const estimateAccountMaxSpendable = jest.fn().mockResolvedValue(new BigNumber(123456));
const buildAccountTx = jest.fn().mockResolvedValue({ fee: 999, inputs: [], outputs: [] });

// swap-able explorer for each test
let currentExplorer: any = {
  getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00001000" }), // 1 sat/vB
};

class DummyStrategy {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(..._args: any[]) {}
}

jest.mock("./wallet-btc", () => ({
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
}));

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

test("clamps manual 1 sat/vB to floor+1 (relay=1 → 2)", async () => {
  const account = makeAccount();
  const tx = makeTx(1);

  await buildTransaction(account, tx);

  const fee1 = estimateAccountMaxSpendable.mock.calls[0][1]; // number
  const fee2 = buildAccountTx.mock.calls[0][0].feePerByte as number; // number
  expect(fee1).toBe(2);
  expect(fee2).toBe(2);
});

test("does not clamp when user fee is already above floor+1 (relay=1, user=3)", async () => {
  const account = makeAccount();
  const tx = makeTx(3);

  await buildTransaction(account, tx);

  expect(estimateAccountMaxSpendable.mock.calls[0][1]).toBe(3);
  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(3);
});

test("ceil fractional user fee and apply floor logic (user=1.2, relay=1 → 2)", async () => {
  const account = makeAccount();
  const tx = makeTx(1.2);

  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(2);
});

test("higher floor (relay=0.00002000 → 2 sat/vB) clamps user=1 to 3 (floor+1)", async () => {
  setExplorer({ getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00002000" }) });
  const account = makeAccount();
  const tx = makeTx(1);

  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(3);
});

test("fallback to floor=1 when getNetwork throws (user=1 → 2)", async () => {
  setExplorer({ getNetwork: jest.fn().mockRejectedValue(new Error("boom")) });
  const account = makeAccount();
  const tx = makeTx(1);

  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(2);
});

test("tiny floor rounds safely (relay=0.00000050 BTC/kB ≈ 0.05 sat/vB → ceil 1; +1 → 2)", async () => {
  setExplorer({ getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.00000050" }) });
  const account = makeAccount();
  const tx = makeTx(1);

  await buildTransaction(account, tx);

  expect(buildAccountTx.mock.calls[0][0].feePerByte).toBe(2);
});

test("throws when feePerByte is missing", async () => {
  const account = makeAccount();
  await expect(
    buildTransaction(account, { ...makeTx(1), feePerByte: null } as any),
  ).rejects.toThrow(); // FeeNotLoaded
});
