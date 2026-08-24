import type {
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { setEnv } from "@ledgerhq/live-env";
import { createStxTransferTransaction, createTokenTransferTransaction } from "../../common-logic";
import type { StacksTxData } from "../../types";
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
  overrides: Partial<TransactionIntent<MemoNotSupported, StacksTxData>> = {},
): TransactionIntent<MemoNotSupported, StacksTxData> {
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
