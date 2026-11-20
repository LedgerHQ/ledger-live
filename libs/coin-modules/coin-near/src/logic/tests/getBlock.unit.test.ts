import { mockNearContext } from "../../test/context";
import {
  fetchBlockTransactions,
  fetchIndexedBlock,
  fetchTransactionReceipts,
} from "../../network/blockTransactions";
import type { NearReceiptNode, NearTransaction } from "../../network/sdk.types";
import { getBlock } from "../getBlock";

jest.mock("../../network/blockTransactions", () => ({
  fetchBlockTransactions: jest.fn(),
  fetchIndexedBlock: jest.fn(),
  fetchTransactionReceipts: jest.fn(),
}));

const USER = "user.near";
const POOL = "pool.near";
const NATIVE = { type: "native" } as const;

const transaction = (overrides: Partial<NearTransaction> = {}): NearTransaction => ({
  signer_account_id: USER,
  receiver_account_id: POOL,
  transaction_hash: "TxHash1",
  block_timestamp: "1794769197544922322",
  outcomes: { status: true },
  outcomes_agg: { transaction_fee: "1352240164463600000000" },
  ...overrides,
});

const node = (
  predecessor: string,
  receiver: string,
  actions: NearReceiptNode["actions"],
  overrides: Partial<NearReceiptNode> = {},
): NearReceiptNode => ({
  predecessor_account_id: predecessor,
  receiver_account_id: receiver,
  actions,
  outcome: { status: true },
  ...overrides,
});

const deposit = (amount: string) => ({
  action: "TRANSFER",
  method: null,
  args: { deposit: amount },
});
const call = (method: string, amount = "0") => ({
  action: "FUNCTION_CALL",
  method,
  args: { deposit: amount },
});

const operationsOf = async (receipts: NearReceiptNode, tx = transaction()) => {
  (fetchBlockTransactions as jest.Mock).mockResolvedValue([tx]);
  (fetchTransactionReceipts as jest.Mock).mockResolvedValue(receipts);

  const { transactions } = await getBlock(mockNearContext, 224_706_785);

  return transactions[0];
};

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchIndexedBlock as jest.Mock).mockResolvedValue({
      block_hash: "BlockHash1",
      block_height: "224706785",
      block_timestamp: "1794769197544922322",
    });
    (fetchBlockTransactions as jest.Mock).mockResolvedValue([]);
  });

  it("maps the indexed block and lists its transactions by hash", async () => {
    const { info } = await getBlock(mockNearContext, 224_706_785);

    expect(info).toMatchObject({
      height: 224_706_785,
      hash: "BlockHash1",
      time: new Date(1_794_769_197_544),
    });
    expect(fetchIndexedBlock).toHaveBeenCalledWith(expect.anything(), 224_706_785);
    expect(fetchBlockTransactions).toHaveBeenCalledWith(expect.anything(), "BlockHash1");
  });

  it.each([-1, 1.5, Number.NaN])(
    "rejects the invalid height %p without a request",
    async height => {
      await expect(getBlock(mockNearContext, height)).rejects.toThrow("invalid block height");
      expect(fetchIndexedBlock).not.toHaveBeenCalled();
    },
  );

  it("credits a pool withdrawal executed in a later block and ignores the gas refunds", async () => {
    const withdrawal = node(USER, POOL, [call("withdraw")], {
      receipts: [
        node(POOL, USER, [deposit("1000")], {
          receipts: [node("system", USER, [deposit("77")])],
        }),
      ],
    });

    await expect(operationsOf(withdrawal)).resolves.toMatchObject({
      hash: "TxHash1",
      failed: false,
      fees: 1_352_240_164_463_600_000_000n,
      feesPayer: USER,
      operations: [
        { type: "transfer", address: POOL, peer: USER, asset: NATIVE, amount: -1000n },
        { type: "transfer", address: USER, peer: POOL, asset: NATIVE, amount: 1000n },
        { type: "other", actionType: "FUNCTION_CALL", method: "withdraw" },
      ],
    });
  });

  it("moves the deposit attached to a function call", async () => {
    const { operations } = await operationsOf(node(USER, "contract.near", [call("buy", "5")]));

    expect(operations).toMatchObject([
      { type: "transfer", address: USER, peer: "contract.near", asset: NATIVE, amount: -5n },
      { type: "transfer", address: "contract.near", peer: USER, asset: NATIVE, amount: 5n },
      { type: "other", actionType: "FUNCTION_CALL", method: "buy" },
    ]);
  });

  it.each([
    [
      "a failed gas refund to the deleted account",
      node("system", "gone.near", [deposit("20")], {
        public_key: "ed25519:8fsvZv9CTpcTZL6uHzJpsDCjmJdg7tAeUXpq1Nz9X8dY",
        outcome: { status: false },
      }),
    ],
    [
      "a successful gas refund to a beneficiary that signed",
      node("system", "heir.near", [deposit("20")], {
        public_key: "ed25519:8fsvZv9CTpcTZL6uHzJpsDCjmJdg7tAeUXpq1Nz9X8dY",
      }),
    ],
  ])("credits the beneficiary of a deleted account once, ignoring %s", async (_name, gasRefund) => {
    const deletion = node(
      "gone.near",
      "gone.near",
      [{ action: "DELETE_ACCOUNT", method: null, args: { beneficiary_id: "heir.near" } }],
      {
        receipts: [
          node("system", "heir.near", [deposit("900")], {
            public_key: "ed25519:11111111111111111111111111111111",
          }),
          gasRefund,
        ],
      },
    );

    const { operations } = await operationsOf(deletion);

    expect(operations).toMatchObject([
      { type: "transfer", address: "gone.near", peer: "heir.near", asset: NATIVE, amount: -900n },
      { type: "transfer", address: "heir.near", peer: "gone.near", asset: NATIVE, amount: 900n },
      { type: "other", actionType: "DELETE_ACCOUNT" },
    ]);
  });

  describe("on a failed transaction", () => {
    const failed = transaction({ outcomes: { status: false } });

    it("keeps the fees and drops the transfer of the receipt that failed", async () => {
      const receipts = node(USER, "contract.near", [call("buy", "5")], {
        outcome: { status: false },
      });

      await expect(operationsOf(receipts, failed)).resolves.toMatchObject({
        failed: true,
        fees: 1_352_240_164_463_600_000_000n,
        operations: [{ type: "other", actionType: "FUNCTION_CALL", method: "buy" }],
      });
    });

    it("keeps the transfer of a receipt that succeeded before a later one failed", async () => {
      const receipts = node(USER, POOL, [deposit("5")], {
        receipts: [node(POOL, "other.near", [deposit("3")], { outcome: { status: false } })],
      });

      const { operations } = await operationsOf(receipts, failed);

      expect(operations).toMatchObject([
        { type: "transfer", address: USER, peer: POOL, asset: NATIVE, amount: -5n },
        { type: "transfer", address: POOL, peer: USER, asset: NATIVE, amount: 5n },
      ]);
    });
  });

  const { outcomes_agg: _fee, ...withoutFee } = transaction();

  it.each([
    ["status", transaction({ outcomes: {} })],
    ["fee", withoutFee],
  ])("rejects a transaction whose %s is not indexed yet", async (_name, tx) => {
    await expect(operationsOf(node(USER, POOL, []), tx)).rejects.toThrow(
      "execution outcome of transaction TxHash1 is not indexed yet",
    );
  });
});
