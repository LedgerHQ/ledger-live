import { http, HttpResponse } from "msw";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { estimateFees } from "../estimateFees";
import { DerivationModes, cryptoFor, maxTxSizeCeil } from "../selectUtxos";
import { FUNDED_P2WPKH, PRISTINE_P2PKH } from "./helpers/fixtures";
import {
  explorerUrl,
  feesHandler,
  networkHandler,
  pendingUtxosHandler,
  server,
  testContext,
  txHandler,
  useMswServer,
  utxosHandler,
} from "./helpers/msw";

useMswServer();

const crypto = cryptoFor("bitcoin");
const vsize = (inputs: number, change: boolean, recipient = PRISTINE_P2PKH) =>
  BigInt(
    maxTxSizeCeil(
      inputs,
      [crypto.toOutputScript(recipient)],
      change,
      crypto,
      DerivationModes.NATIVE_SEGWIT,
    ),
  );

const intent = (overrides: Partial<TransactionIntent> = {}): TransactionIntent => ({
  intentType: "transaction",
  type: "send",
  sender: FUNDED_P2WPKH,
  recipient: PRISTINE_P2PKH,
  amount: 10_000n,
  asset: { type: "native" },
  ...overrides,
});

const utxo = (hash: string, value: number) => ({
  txId: hash.repeat(64),
  hash: hash.repeat(64),
  outputIndex: 0,
  value: String(value),
  hex: "0014bde9a3ed3b773c4db1d7e5335dad614a2b9b9921",
  type: "witness_v0_keyhash",
  owner: FUNDED_P2WPKH,
  height: 944351,
});

// sat/kB → 13, 12 and 12 sat/vB (rounded up): fast, medium, slow.
const FEES = { "2": 12_100, "4": 11_740, "6": 11_030 };

// Fails the test if the explorer's rates were read.
const noRates = () =>
  http.get(`${explorerUrl()}/fees`, () => HttpResponse.json({}, { status: 500 }));

describe("estimateFees", () => {
  beforeEach(() =>
    server.use(feesHandler(FEES), networkHandler(), pendingUtxosHandler(FUNDED_P2WPKH)),
  );

  it("does not spend an output a mempool transaction already spends", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000), utxo("b", 50_000)], token: null }]),
      pendingUtxosHandler(FUNDED_P2WPKH, { spent: [utxo("a", 100_000)] }),
    );
    const estimation = await estimateFees(testContext(), "bitcoin", intent({ useAllAmount: true }));
    expect(estimation.parameters?.inputCount).toBe(1);
  });

  it("spends the change of the address's own unconfirmed transaction", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 120_000)], token: null }]),
      pendingUtxosHandler(FUNDED_P2WPKH, {
        spent: [utxo("a", 120_000)],
        created: [utxo("c", 100_000)],
      }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
    );
    const estimation = await estimateFees(testContext(), "bitcoin", intent());
    expect(estimation.parameters).toEqual(
      expect.objectContaining({ inputCount: 1, sufficient: true }),
    );
  });

  it("prices the transaction at the medium rate by default", async () => {
    server.use(utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]));
    const estimation = await estimateFees(testContext(), "bitcoin", intent());
    expect(estimation).toEqual({
      value: vsize(1, true) * 12n,
      parameters: {
        feePerByte: 12n,
        inputCount: 1,
        change: 100_000n - 10_000n - vsize(1, true) * 12n,
        sufficient: true,
      },
    });
  });

  it("follows the UTXO pagination", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [
        { data: [utxo("a", 6_000)], token: "1" },
        { data: [utxo("b", 7_000)], token: null },
      ]),
    );
    const estimation = await estimateFees(testContext(), "bitcoin", intent({ amount: 12_000n }));
    expect(estimation.parameters?.inputCount).toBe(2);
  });

  it("uses the fast rate when asked", async () => {
    server.use(utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]));
    const estimation = await estimateFees(testContext(), "bitcoin", intent(), {
      feesStrategy: "fast",
    });
    expect(estimation.parameters?.feePerByte).toBe(13n);
  });

  it("prices a custom absolute fee intent at the relay minimum, without the explorer's rates or a sweep amount", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]),
      noRates(),
    );
    const estimation = await estimateFees(
      testContext(),
      "bitcoin",
      intent({ useAllAmount: true, amount: 0n }),
      { feesStrategy: "custom" },
    );
    expect(estimation.parameters?.feePerByte).toBe(1n);
    expect(estimation.value).toBe(vsize(1, false) * 1n);
    expect(estimation.parameters).not.toHaveProperty("amount");
  });

  it("uses a custom rate as given, below the relay rate included, and prices its send-max", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]),
      networkHandler("0.00005"),
      noRates(),
    );
    const estimation = await estimateFees(
      testContext(),
      "bitcoin",
      intent({ useAllAmount: true, amount: 0n }),
      { feesStrategy: "custom", feePerByte: 2n },
    );
    expect(estimation.parameters?.feePerByte).toBe(2n);
    expect(estimation.parameters?.amount).toBe(100_000n - vsize(1, false) * 2n);
  });

  it("imposes a custom fee rate without reading the explorer's rates", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]),
      // Fails the test if the explorer's rates were read.
      http.get(`${explorerUrl()}/fees`, () => HttpResponse.json({}, { status: 500 })),
    );
    const estimation = await estimateFees(testContext(), "bitcoin", intent(), { feePerByte: 3n });
    expect(estimation.value).toBe(vsize(1, true) * 3n);
  });

  it("never goes below the network's relay fee", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]),
      networkHandler("0.00005"),
    );
    const estimation = await estimateFees(testContext(), "bitcoin", intent(), { feePerByte: 1n });
    expect(estimation.parameters?.feePerByte).toBe(5n);
  });

  it("floors at 1 sat/vB when the explorer gives no relay fee", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]),
      networkHandler(null),
      feesHandler({ "2": 100, "4": 100, "6": 100 }),
    );
    const estimation = await estimateFees(testContext(), "bitcoin", intent());
    expect(estimation.parameters?.feePerByte).toBe(1n);
  });

  it.each([
    [{ feesStrategy: "turbo" }, "unknown fees strategy: turbo"],
    [{ feePerByte: 0n }, "feePerByte must be positive"],
  ])("rejects invalid fee parameters %o", async (parameters, message) => {
    server.use(utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]));
    await expect(estimateFees(testContext(), "bitcoin", intent(), parameters)).rejects.toThrow(
      message,
    );
  });

  it("spends every output for useAllAmount", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 6_000), utxo("b", 7_000)], token: null }]),
    );
    const estimation = await estimateFees(
      testContext(),
      "bitcoin",
      intent({ useAllAmount: true, amount: 0n }),
    );
    expect(estimation.value).toBe(vsize(2, false) * 12n);
    expect(estimation.parameters).toEqual(
      expect.objectContaining({
        inputCount: 2,
        change: 0n,
        sufficient: true,
        amount: 13_000n - vsize(2, false) * 12n,
      }),
    );
  });

  it("prices with an output of the sender's type while the recipient is not valid yet", async () => {
    server.use(utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]));
    const estimation = await estimateFees(testContext(), "bitcoin", intent({ recipient: "" }));
    expect(estimation.value).toBe(vsize(1, true, FUNDED_P2WPKH) * 12n);
  });

  it("reports insufficient funds instead of failing", async () => {
    server.use(utxosHandler(FUNDED_P2WPKH, [{ data: [], token: null }]));
    const estimation = await estimateFees(testContext(), "bitcoin", intent());
    expect(estimation.parameters?.sufficient).toBe(false);
    expect(estimation.value).toBeGreaterThan(0n);
  });

  it("propagates an explorer error", async () => {
    server.use(
      utxosHandler(FUNDED_P2WPKH, [{ data: [utxo("a", 100_000)], token: null }]),
      feesHandler({}),
    );
    await expect(estimateFees(testContext(), "bitcoin", intent())).rejects.toThrow(
      "explorer returned no fee rates",
    );
  });
});
