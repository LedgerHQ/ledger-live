import coinConfig from "../config";
import { DEFAULT_TRC20_FEES_LIMIT } from "../network";
import { decode58Check } from "../network/format";
import { craftTransaction } from "./craftTransaction";
import { decodeTransaction } from "./utils";

describe("craftTransaction Integration Tests", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });

  it("should create a valid transaction with minimum required fields", async () => {
    const amount = BigInt(3);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    // WHEN
    const result = await craftTransaction({
      type: "send",
      asset: {
        standard: "trc10",
        tokenId: "1002000",
      },
      sender,
      recipient,
      amount,
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
    const result = await craftTransaction({
      type: "send",
      asset: {
        standard: "trc20",
        contractAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
      },
      sender,
      recipient,
      amount,
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

  it("should use default fees limit when user does not provide it for a TRC20 transaction", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    const result = await craftTransaction({
      type: "send",
      asset: {
        standard: "trc20",
        contractAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
      },
      sender,
      recipient,
      amount,
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

  it("should use user fees limit when user provide it for a TRC20 transaction", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    const feesLimit = 99n;
    const result = await craftTransaction(
      {
        type: "send",
        asset: {
          standard: "trc20",
          contractAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
        },
        sender,
        recipient,
        amount,
      },
      feesLimit,
    );

    const decodeResult = await decodeTransaction(result);
    expect(decodeResult).toEqual(
      expect.objectContaining({
        raw_data: expect.objectContaining({
          fee_limit: Number(feesLimit),
        }),
      }),
    );
  });

  it("should create a valid transaction for native TRX", async () => {
    const amount = BigInt(20);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    // WHEN
    const result = await craftTransaction({
      type: "send",
      sender,
      recipient,
      amount,
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
});
