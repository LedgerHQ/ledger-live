import type { TronCoinConfig } from "../config";
import { DEFAULT_TRC20_FEES_LIMIT } from "../network";
import { decode58Check } from "../network/format";
import { craftTransaction } from "./craftTransaction";
import { decodeTransaction } from "./utils";

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

describe("Testing craftTransaction function", () => {
  it("should create a valid transaction with minimum required fields", async () => {
    const amount = BigInt(3);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    // WHEN
    const { transaction: result } = await craftTransaction(mockConfig, {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc10",
        assetReference: "1002000",
      },
      sender,
      recipient,
      amount,
      data: { type: "tron" },
    });

    const decodeResult = await decodeTransaction(result);

    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          contract: [
            expect.objectContaining({
              type: "TransferAssetContract",
              parameter: expect.objectContaining({
                value: expect.objectContaining({
                  amount: 3,
                  asset_name: "1002000",
                  owner_address: decode58Check(sender),
                  to_address: decode58Check(recipient),
                }),
                type_url: "type.googleapis.com/protocol.TransferAssetContract",
              }),
            }),
          ],
        }),
      }),
    );
  });

  it("should create a valid transaction for TRC20", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    // WHEN
    const { transaction: result } = await craftTransaction(mockConfig, {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc20",
        assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
      },
      sender,
      recipient,
      amount,
      data: { type: "tron" },
    });

    const decodeResult = await decodeTransaction(result);

    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          contract: [
            expect.objectContaining({
              type: "TriggerSmartContract",
              parameter: expect.objectContaining({
                value: expect.objectContaining({
                  data: expect.any(String),
                  owner_address: decode58Check(sender),
                  contract_address: decode58Check("TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7"),
                }),
                type_url: "type.googleapis.com/protocol.TriggerSmartContract",
              }),
            }),
          ],
        }),
      }),
    );
  });

  it("should use default fees when user does not provide it for crafting a TRC20 transaction", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    const { transaction: result } = await craftTransaction(mockConfig, {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc20",
        assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
      },
      sender,
      recipient,
      amount,
      data: { type: "tron" },
    });

    const decodeResult = await decodeTransaction(result);
    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          fee_limit: DEFAULT_TRC20_FEES_LIMIT,
        }),
      }),
    );
  });

  it("should pass a 0 custom fee straight through for a TRC20 transaction", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    const { transaction: result } = await craftTransaction(
      mockConfig,
      {
        intentType: "transaction",
        type: "send",
        asset: {
          type: "trc20",
          assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
        },
        sender,
        recipient,
        amount,
        data: { type: "tron" },
      },
      { value: 0n, parameters: { fees: 0n } },
    );

    const decodeResult = await decodeTransaction(result);
    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          contract: [
            expect.objectContaining({
              type: "TriggerSmartContract",
              parameter: expect.objectContaining({
                value: expect.objectContaining({
                  data: expect.any(String),
                  owner_address: decode58Check(sender),
                  contract_address: decode58Check("TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7"),
                }),
                type_url: "type.googleapis.com/protocol.TriggerSmartContract",
              }),
            }),
          ],
        }),
      }),
    );
    // A `0` cap serialises to no `fee_limit` field: protobuf omits zero scalars and the decoder
    // (`utils.ts`) only surfaces `fee_limit` when `getFeeLimit()` is truthy.
    expect(decodeResult.raw_data.fee_limit).toBeUndefined();
  });

  it("should default the fee limit for an auto-resolved fee with no override marker for a TRC20 transaction", async () => {
    // LIVE-36865: the generic framework passes the net display fee as customFees.value on every send,
    // with no override marker; that value is 0 for an energy-covered account. Without the marker it must
    // NOT pin the fee_limit to 0 — the default ceiling applies, otherwise the tx reverts OUT_OF_ENERGY.
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    const { transaction: result } = await craftTransaction(
      mockConfig,
      {
        intentType: "transaction",
        type: "send",
        asset: {
          type: "trc20",
          assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
        },
        sender,
        recipient,
        amount,
        data: { type: "tron" },
      },
      { value: 0n },
    );

    const decodeResult = await decodeTransaction(result);
    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          fee_limit: DEFAULT_TRC20_FEES_LIMIT,
        }),
      }),
    );
  });

  it("should pass a custom fee below the default straight through for a TRC20 transaction", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    const customFees = 99n;
    const { transaction: result } = await craftTransaction(
      mockConfig,
      {
        intentType: "transaction",
        type: "send",
        asset: {
          type: "trc20",
          assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
        },
        sender,
        recipient,
        amount,
        data: { type: "tron" },
      },
      { value: customFees, parameters: { fees: customFees } },
    );

    const decodeResult = await decodeTransaction(result);
    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          fee_limit: 99,
        }),
      }),
    );
  });

  it("should create a valid transaction for native TRX", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    // WHEN
    const { transaction: result } = await craftTransaction(mockConfig, {
      intentType: "transaction",
      asset: { type: "native" },
      type: "send",
      sender,
      recipient,
      amount,
      data: { type: "tron" },
    });

    const decodeResult = await decodeTransaction(result);

    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          contract: [
            expect.objectContaining({
              type: "TransferContract",
              parameter: expect.objectContaining({
                value: expect.objectContaining({
                  amount: 20,
                  owner_address: decode58Check(sender),
                  to_address: decode58Check(recipient),
                }),
                type_url: "type.googleapis.com/protocol.TransferContract",
              }),
            }),
          ],
        }),
      }),
    );
  });

  it("should create a valid transaction when setting a memo", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    // WHEN
    const { transaction: result } = await craftTransaction(mockConfig, {
      intentType: "transaction",
      asset: { type: "native" },
      type: "send",
      sender,
      recipient,
      amount,
      data: { type: "tron" },
      memo: {
        type: "string",
        kind: "memo",
        value: "this is a test",
      },
    });

    const decodeResult = await decodeTransaction(result);

    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          data: Buffer.from("this is a test"),
        }),
      }),
    );
  });

  it("throw expected error when setting a memo on a smart contract transaction", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    await expect(
      craftTransaction(mockConfig, {
        intentType: "transaction",
        type: "send",
        asset: {
          type: "trc20",
          assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
        },
        sender,
        recipient,
        amount,
        data: { type: "tron" },
        memo: {
          type: "string",
          kind: "memo",
          value: "test",
        },
      }),
    ).rejects.toThrow("Memo cannot be used with smart contract transactions");
  });

  it("should set an expiration of 10 minutes by default when setting is not provided", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    const before = Date.now();

    // WHEN
    const { transaction: result } = await craftTransaction(mockConfig, {
      intentType: "transaction",
      asset: { type: "native" },
      type: "send",
      sender,
      recipient,
      amount,
      data: { type: "tron" },
    });

    const after = Date.now();

    const decodeResult = await decodeTransaction(result);

    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          expiration: expect.any(Number),
        }),
      }),
    );
    expect(decodeResult.raw_data.expiration).toBeGreaterThanOrEqual(before + 10 * 60 * 1000);
    expect(decodeResult.raw_data.expiration).toBeLessThanOrEqual(after + 11 * 60 * 1000);
  });

  it("should create a valid transaction when setting a custom expiration", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";
    const expiration = 24 * 3600;

    const before = Date.now();

    // WHEN
    const { transaction: result } = await craftTransaction(mockConfig, {
      intentType: "transaction",
      asset: { type: "native" },
      type: "send",
      sender,
      recipient,
      amount,
      expiration,
      data: { type: "tron" },
    });

    const after = Date.now();

    const decodeResult = await decodeTransaction(result);

    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          expiration: expect.any(Number),
        }),
      }),
    );
    expect(decodeResult.raw_data.expiration).toBeGreaterThanOrEqual(before + expiration * 1000);
    expect(decodeResult.raw_data.expiration).toBeLessThanOrEqual(after + (expiration + 60) * 1000);
  });
});
