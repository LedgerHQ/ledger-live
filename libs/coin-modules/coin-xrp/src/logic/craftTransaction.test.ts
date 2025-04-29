import { craftTransaction } from "./craftTransaction";
import { decode } from "ripple-binary-codec";
jest.mock("../network", () => ({
  getLedgerIndex: () => 1,
}));

describe("craftTransaction", () => {
  it("returns a valid transaction object when no pubkey is provided", async () => {
    // Given
    const account = {
      address: "rPDf6SQStnNmw1knCu1ei7h6BcDAEUUqn5",
      nextSequenceNumber: 2,
    };
    const transaction = {
      recipient: "rJe1St1G6BWMFmdrrcT7NdD3XT1NxTMEWN",
      amount: BigInt(100_000_000),
      fee: BigInt(100),
    };

    // When
    const result = await craftTransaction(account, transaction);

    // Then
    expect(result).toBeDefined();
    expect(result.xrplTransaction).toEqual({
      TransactionType: "Payment",
      Account: "rPDf6SQStnNmw1knCu1ei7h6BcDAEUUqn5",
      Amount: "100000000",
      Destination: "rJe1St1G6BWMFmdrrcT7NdD3XT1NxTMEWN",
      DestinationTag: undefined,
      Fee: "100",
      Flags: 2147483648,
      Sequence: 2,
      LastLedgerSequence: 21,
    });
    expect(result.serializedTransaction).toBeDefined();
  });

  it("returns a valid transaction object when pubky is provided", async () => {
    // Given
    const account = {
      address: "rPDf6SQStnNmw1knCu1ei7h6BcDAEUUqn5",
      nextSequenceNumber: 2,
    };
    const transaction = {
      recipient: "rJe1St1G6BWMFmdrrcT7NdD3XT1NxTMEWN",
      amount: BigInt(100_000_000),
      fee: BigInt(100),
      memos: [{ data: "01", format: "02", type: "03" }],
      destinationTag: 123,
    };
    const pubKey = "public_key";

    // When
    const result = await craftTransaction(account, transaction, pubKey);

    // Then
    expect(result).toBeDefined();
    expect(result.xrplTransaction).toEqual({
      TransactionType: "Payment",
      Account: "rPDf6SQStnNmw1knCu1ei7h6BcDAEUUqn5",
      Amount: "100000000",
      Destination: "rJe1St1G6BWMFmdrrcT7NdD3XT1NxTMEWN",
      DestinationTag: 123,
      Fee: "100",
      Flags: 2147483648,
      Sequence: 2,
      LastLedgerSequence: 21,
      Memos: [{ Memo: { MemoData: "01", MemoFormat: "02", MemoType: "03" } }],
    });
    expect(result.serializedTransaction).toBeDefined();
    const binDecodedTx = decode(result.serializedTransaction);
    expect(binDecodedTx.Memos).toEqual([
      { Memo: { MemoData: "01", MemoFormat: "02", MemoType: "03" } },
    ]);
    expect(binDecodedTx.DestinationTag).toEqual(123);
  });
});
