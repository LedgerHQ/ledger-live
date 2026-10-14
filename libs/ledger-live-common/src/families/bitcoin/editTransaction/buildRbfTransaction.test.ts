import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { bitcoinPickingStrategy, type BitcoinOutput } from "../types";
import { getNextChangeAddress, getOwnDisplayAddresses } from "../accountModule/account";
import { getReplacementEstimate } from "./replacement";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "./buildRbfTransaction";

jest.mock("./replacement", () => ({
  getReplacementEstimate: jest.fn(),
}));

jest.mock("../accountModule/account", () => ({
  getNextChangeAddress: jest.fn(),
  getOwnDisplayAddresses: jest.fn(),
}));

const mockedGetReplacementEstimate = getReplacementEstimate as jest.Mock;
const mockedGetNextChangeAddress = getNextChangeAddress as jest.Mock;
const mockedGetOwnDisplayAddresses = getOwnDisplayAddresses as jest.Mock;

const ORIGINAL_TXID = "orig-txid";
const EXTERNAL = "external-1";
const OTHER_EXTERNAL = "external-2";
const OWN = "own-1";
const CHANGE = "change-addr";

const feeRates = { slow: 5n, medium: 10n, fast: 20n };

const utxo = (hash: string, overrides: Partial<BitcoinOutput> = {}): BitcoinOutput => ({
  hash,
  outputIndex: 0,
  blockHeight: 10,
  address: OWN,
  value: new BigNumber(1000),
  rbf: false,
  isChange: false,
  ...overrides,
});

const makeAccount = (overrides: Record<string, unknown> = {}): Account =>
  ({
    currency: { id: "bitcoin" },
    pendingOperations: [{ hash: ORIGINAL_TXID, recipients: [EXTERNAL] }],
    bitcoinResources: {
      utxos: [
        utxo("pending-change", { blockHeight: null, isChange: true }),
        utxo("confirmed-change", { isChange: true }),
        utxo("pending-receive", { blockHeight: null }),
        utxo("pending-change-2", { blockHeight: undefined, isChange: true, outputIndex: 1 }),
      ],
    },
    ...overrides,
  }) as unknown as Account;

const sendOutputs = [
  { address: EXTERNAL, value: 50_000n },
  { address: OWN, value: 40_000n },
];

describe("buildRbfTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetNextChangeAddress.mockResolvedValue({ address: CHANGE, path: "84'/0'/0'/1/3" });
    mockedGetOwnDisplayAddresses.mockReturnValue(new Set([OWN, CHANGE]));
    mockedGetReplacementEstimate.mockResolvedValue({
      feeRates,
      minReplacementFeePerByte: 12n,
      replacedOutputs: sendOutputs,
    });
  });

  describe("buildRbfSpeedUpTx", () => {
    it("keeps the recipient and amount of the replaced send, at the network fast rate", async () => {
      const account = makeAccount();

      const result = await buildRbfSpeedUpTx(account, ORIGINAL_TXID);

      expect(mockedGetReplacementEstimate).toHaveBeenCalledWith(account, ORIGINAL_TXID);
      expect(mockedGetNextChangeAddress).toHaveBeenCalledWith(account);
      expect(result).toEqual({
        family: "bitcoin",
        mode: "send",
        amount: new BigNumber(50_000),
        recipient: EXTERNAL,
        useAllAmount: false,
        feesStrategy: "fast",
        familySpecificData: {
          utxoStrategy: {
            strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
            // pending change only: confirmed change and pending receives stay spendable
            excludeUTXOs: [
              { hash: "pending-change", outputIndex: 0 },
              { hash: "pending-change-2", outputIndex: 1 },
            ],
          },
          rbf: true,
          replaceTxId: ORIGINAL_TXID,
          changeAddress: CHANGE,
        },
      });
      expect(result.familySpecificData).not.toHaveProperty("feePerByte");
    });

    it("uses a custom rate when the minimum replacement rate is above the fast rate", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({
        feeRates,
        minReplacementFeePerByte: 25n,
        replacedOutputs: sendOutputs,
      });

      const result = await buildRbfSpeedUpTx(makeAccount(), ORIGINAL_TXID);

      expect(result.feesStrategy).toBe("custom");
      expect(result.familySpecificData?.feePerByte).toBe("25");
    });

    it("sums the external outputs when the known recipient is not among them", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({
        feeRates,
        minReplacementFeePerByte: 12n,
        replacedOutputs: [
          { address: null, value: 0n }, // OP_RETURN
          { address: OTHER_EXTERNAL, value: 30_000n },
          { address: OWN, value: 10_000n },
          { address: EXTERNAL, value: 20_000n },
        ],
      });
      const account = makeAccount({
        pendingOperations: [{ hash: ORIGINAL_TXID, recipients: ["somewhere-else"] }],
      });

      const result = await buildRbfSpeedUpTx(account, ORIGINAL_TXID);

      expect(mockedGetOwnDisplayAddresses).toHaveBeenCalledWith(account);
      expect(result.amount).toEqual(new BigNumber(50_000));
      expect(result.recipient).toBe(OTHER_EXTERNAL);
    });

    it.each([
      ["no pending operation for the replaced transaction", []],
      ["a pending operation without recipients", [{ hash: ORIGINAL_TXID }]],
    ])("detects the recipient from the outputs with %s", async (_, pendingOperations) => {
      const result = await buildRbfSpeedUpTx(makeAccount({ pendingOperations }), ORIGINAL_TXID);

      expect(result.amount).toEqual(new BigNumber(50_000));
      expect(result.recipient).toBe(EXTERNAL);
    });

    it("matches the known recipient in its displayed form (bitcoin cash)", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({
        feeRates,
        minReplacementFeePerByte: 12n,
        replacedOutputs: [
          { address: "bitcoincash:qrecipient", value: 7_000n },
          { address: "bitcoincash:qchange", value: 1_000n },
        ],
      });
      const account = makeAccount({
        currency: { id: "bitcoin_cash" },
        pendingOperations: [{ hash: ORIGINAL_TXID, recipients: ["qrecipient"] }],
      });

      const result = await buildRbfSpeedUpTx(account, ORIGINAL_TXID);

      expect(result.recipient).toBe("qrecipient");
      expect(result.amount).toEqual(new BigNumber(7_000));
      expect(mockedGetOwnDisplayAddresses).not.toHaveBeenCalled();
    });

    it("shows the detected recipient in its displayed form (bitcoin cash)", async () => {
      mockedGetOwnDisplayAddresses.mockReturnValue(new Set(["qchange"]));
      mockedGetReplacementEstimate.mockResolvedValue({
        feeRates,
        minReplacementFeePerByte: 12n,
        replacedOutputs: [
          { address: "bitcoincash:qrecipient", value: 7_000n },
          { address: "bitcoincash:qchange", value: 1_000n },
        ],
      });
      const account = makeAccount({ currency: { id: "bitcoin_cash" }, pendingOperations: [] });

      const result = await buildRbfSpeedUpTx(account, ORIGINAL_TXID);

      expect(result.recipient).toBe("qrecipient");
      expect(result.amount).toEqual(new BigNumber(7_000));
    });

    it("sends nothing to nobody when every output is the account's own", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({
        feeRates,
        minReplacementFeePerByte: 12n,
        replacedOutputs: [{ address: OWN, value: 40_000n }],
      });

      const result = await buildRbfSpeedUpTx(makeAccount({ pendingOperations: [] }), ORIGINAL_TXID);

      expect(result.amount).toEqual(new BigNumber(0));
      expect(result.recipient).toBe("");
    });

    it("falls back to zero rates, no output and no exclusion when nothing is known", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({});

      const result = await buildRbfSpeedUpTx(
        makeAccount({ pendingOperations: [], bitcoinResources: undefined }),
        ORIGINAL_TXID,
      );

      expect(result.amount).toEqual(new BigNumber(0));
      expect(result.recipient).toBe("");
      // a zero rate is the (zero) fast rate
      expect(result.feesStrategy).toBe("fast");
      expect(result.familySpecificData?.utxoStrategy?.excludeUTXOs).toEqual([]);
    });

    it("uses the network fast rate when the minimum replacement rate is unknown", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({ feeRates, replacedOutputs: sendOutputs });

      const result = await buildRbfSpeedUpTx(makeAccount(), ORIGINAL_TXID);

      expect(result.feesStrategy).toBe("fast");
    });

    it("propagates a failed replacement estimation", async () => {
      mockedGetReplacementEstimate.mockRejectedValue(new Error("Transaction is not RBF-enabled"));

      await expect(buildRbfSpeedUpTx(makeAccount(), ORIGINAL_TXID)).rejects.toThrow(
        "Transaction is not RBF-enabled",
      );
    });
  });

  describe("buildRbfCancelTx", () => {
    it("sends the amount of the replaced send back to the next change address", async () => {
      const result = await buildRbfCancelTx(makeAccount(), ORIGINAL_TXID);

      expect(result).toEqual({
        family: "bitcoin",
        mode: "send",
        amount: new BigNumber(50_000),
        recipient: CHANGE,
        useAllAmount: false,
        feesStrategy: "fast",
        familySpecificData: {
          utxoStrategy: {
            strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
            excludeUTXOs: [
              { hash: "pending-change", outputIndex: 0 },
              { hash: "pending-change-2", outputIndex: 1 },
            ],
          },
          rbf: true,
          replaceTxId: ORIGINAL_TXID,
          changeAddress: CHANGE,
        },
      });
    });

    it("uses a custom rate when the minimum replacement rate is above the fast rate", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({
        feeRates,
        minReplacementFeePerByte: 31n,
        replacedOutputs: sendOutputs,
      });

      const result = await buildRbfCancelTx(makeAccount(), ORIGINAL_TXID);

      expect(result.feesStrategy).toBe("custom");
      expect(result.familySpecificData?.feePerByte).toBe("31");
      expect(result.recipient).toBe(CHANGE);
    });

    it("keeps the first non-empty output amount when cancelling a cancel (no external output)", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({
        feeRates,
        minReplacementFeePerByte: 12n,
        replacedOutputs: [
          { address: null, value: 0n },
          { address: OWN, value: 4_321n },
        ],
      });

      const result = await buildRbfCancelTx(makeAccount({ pendingOperations: [] }), ORIGINAL_TXID);

      expect(result.amount).toEqual(new BigNumber(4_321));
      expect(result.recipient).toBe(CHANGE);
    });

    it("cancels with a zero amount when the replaced transaction has no output", async () => {
      mockedGetReplacementEstimate.mockResolvedValue({ feeRates, replacedOutputs: [] });

      const result = await buildRbfCancelTx(makeAccount({ pendingOperations: [] }), ORIGINAL_TXID);

      expect(result.amount).toEqual(new BigNumber(0));
      expect(result.recipient).toBe(CHANGE);
    });
  });
});
