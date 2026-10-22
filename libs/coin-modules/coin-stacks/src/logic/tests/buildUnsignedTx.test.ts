import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { setEnv } from "@ledgerhq/live-env";
import { createStxTransferTransaction, createTokenTransferTransaction } from "../../common-logic";
import { STACKS_DUMMY_PUBLIC_KEY } from "../../constants";
import type { StacksMemo, StacksTxData } from "../../types";
import { getBalance } from "../getBalance";
import { buildUnsignedTx } from "../buildUnsignedTx";

jest.mock("../../common-logic", () => ({
  ...jest.requireActual("../../common-logic"),
  createStxTransferTransaction: jest.fn(),
  createTokenTransferTransaction: jest.fn(),
}));
jest.mock("../getBalance");

const SENDER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const RECIPIENT = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";
const PUBLIC_KEY = "02" + "ab".repeat(32);
const FAKE_TX = { payload: {} };

function transferIntent(
  overrides: Partial<TransactionIntent<StacksMemo, StacksTxData>> = {},
): TransactionIntent<StacksMemo, StacksTxData> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 1000n,
    asset: { type: "native" },
    senderPublicKey: PUBLIC_KEY,
    data: { type: "stacks-pox" },
    ...overrides,
  };
}

describe("buildUnsignedTx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createStxTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);
    (createTokenTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);
  });

  describe("resolveAmount", () => {
    it("uses the intent's own amount without a balance lookup when it is already resolved", async () => {
      await buildUnsignedTx(transferIntent({ useAllAmount: true, amount: 5000n }), 300n, 5n);

      expect(getBalance).not.toHaveBeenCalled();
      const call = (createStxTransferTransaction as jest.Mock).mock.calls[0];
      expect(call[0].toString()).toBe("5000");
    });

    it("falls back to a fresh balance lookup when the amount is still the unresolved placeholder", async () => {
      (getBalance as jest.Mock).mockResolvedValue([{ value: 100000n, asset: { type: "native" } }]);

      await buildUnsignedTx(transferIntent({ useAllAmount: true, amount: 0n }), 300n, 5n);

      expect(getBalance).toHaveBeenCalledWith(SENDER);
      const call = (createStxTransferTransaction as jest.Mock).mock.calls[0];
      expect(call[0].toString()).toBe("99700");
    });
  });

  describe("zero-amount sweep", () => {
    beforeEach(() => {
      (getBalance as jest.Mock).mockResolvedValue([{ value: 0n, asset: { type: "native" } }]);
    });

    it("rejects it when crafting", async () => {
      await expect(
        buildUnsignedTx(transferIntent({ useAllAmount: true, amount: 0n }), 300n, 5n),
      ).rejects.toThrow("amount must be positive");
    });

    it("builds it for a fee estimate, so an empty account's max spendable can be estimated", async () => {
      await buildUnsignedTx(transferIntent({ useAllAmount: true, amount: 0n }), 0n, 5n, {
        forEstimation: true,
      });

      const call = (createStxTransferTransaction as jest.Mock).mock.calls[0];
      expect(call[0].toString()).toBe("0");
    });
  });

  describe("sender public key", () => {
    it("uses a dummy key for fee estimation when a pre-heal account stores its address as xpub", async () => {
      await buildUnsignedTx(transferIntent({ senderPublicKey: SENDER }), 0n, 5n, {
        forEstimation: true,
      });

      expect(createStxTransferTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        STACKS_DUMMY_PUBLIC_KEY,
        expect.anything(),
      );
    });

    it("rejects an address in place of the public key when crafting", async () => {
      await expect(
        buildUnsignedTx(transferIntent({ senderPublicKey: SENDER }), 300n, 5n),
      ).rejects.toThrow("senderPublicKey is required");
    });
  });

  describe("memo", () => {
    const memo: StacksMemo = { type: "string", kind: "memo", value: "1234" };
    const TOKEN = "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.age000-governance-token::alex";

    it("puts the intent's memo on an STX transfer", async () => {
      await buildUnsignedTx(transferIntent({ memo }), 300n, 5n);

      const call = (createStxTransferTransaction as jest.Mock).mock.calls[0];
      expect(call[5]).toEqual(expect.objectContaining({ memo: "1234" }));
    });

    it("puts the intent's memo on a SIP-010 transfer", async () => {
      await buildUnsignedTx(
        transferIntent({
          memo,
          asset: { type: "token", assetReference: TOKEN, assetOwner: SENDER },
        }),
        300n,
        5n,
      );

      expect(createTokenTransferTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ memo: "1234" }),
      );
    });

    it("leaves the memo out when the intent carries none", async () => {
      await buildUnsignedTx(transferIntent(), 300n, 5n);

      const call = (createStxTransferTransaction as jest.Mock).mock.calls[0];
      expect(call[5].memo).toBeUndefined();
    });
  });

  describe("network selection", () => {
    afterEach(() => {
      setEnv("API_STACKS_NETWORK", "");
    });

    it("passes the configured network through when building a transfer", async () => {
      setEnv("API_STACKS_NETWORK", "testnet");

      await buildUnsignedTx(transferIntent(), 300n, 5n);

      const call = (createStxTransferTransaction as jest.Mock).mock.calls[0];
      expect(call[3]).toBe("testnet");
    });
  });
});
