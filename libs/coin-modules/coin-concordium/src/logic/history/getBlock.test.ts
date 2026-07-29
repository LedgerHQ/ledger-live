import { getBlock } from "./getBlock";

jest.mock("./getBlockInfo", () => ({
  getBlockInfo: jest.fn(),
}));

jest.mock("../../network/proxyClient", () => ({
  getBlockTransactionEvents: jest.fn(),
}));

jest.mock("@ledgerhq/concordium-core", () => ({
  decodeMemoFromCbor: jest.fn(),
}));

const { getBlockInfo: getBlockInfoMock } = jest.requireMock("./getBlockInfo");
const { getBlockTransactionEvents: getBlockTransactionEventsMock } = jest.requireMock(
  "../../network/proxyClient",
);
const { decodeMemoFromCbor: decodeMemoFromCborMock } = jest.requireMock(
  "@ledgerhq/concordium-core",
);

const CURRENCY = "concordium_testnet";
const SENDER = "3U6m951FWryY56SKFFHgMLGVHtJtk4VaxN7V2F9hjkR7Sg1FUx";
const RECIPIENT = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";

const BLOCK_INFO = {
  height: 1000,
  hash: "ab".repeat(32),
  time: new Date("2024-01-12T00:00:00.000Z"),
  parent: { height: 999, hash: "cd".repeat(32) },
};

const account = (address: string) => ({ type: "AddressAccount", address });

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBlockInfoMock.mockResolvedValue(BLOCK_INFO);
    decodeMemoFromCborMock.mockReturnValue("");
  });

  it("reuses getBlockInfo for info and returns an empty transaction list for an empty block", async () => {
    // GIVEN
    getBlockTransactionEventsMock.mockResolvedValue([]);

    // WHEN
    const result = await getBlock(1000, CURRENCY);

    // THEN
    expect(getBlockInfoMock).toHaveBeenCalledWith(1000, CURRENCY);
    expect(getBlockTransactionEventsMock).toHaveBeenCalledWith(CURRENCY, BLOCK_INFO.hash);
    expect(result.info).toEqual(BLOCK_INFO);
    expect(result.transactions).toEqual([]);
  });

  it("maps a Transferred event to a signed sender/recipient operation pair with fees on the transaction", async () => {
    // GIVEN
    getBlockTransactionEventsMock.mockResolvedValue([
      {
        hash: "aa".repeat(32),
        sender: SENDER,
        cost: "601",
        result: {
          outcome: "success",
          events: [
            {
              tag: "Transferred",
              amount: "1000000",
              from: account(SENDER),
              to: account(RECIPIENT),
            },
          ],
        },
      },
    ]);

    // WHEN
    const { transactions } = await getBlock(1000, CURRENCY);

    // THEN
    expect(transactions).toEqual([
      {
        hash: "aa".repeat(32),
        failed: false,
        fees: 601n,
        feesPayer: SENDER,
        operations: [
          {
            type: "transfer",
            address: SENDER,
            peer: RECIPIENT,
            asset: { type: "native" },
            amount: -1000000n,
          },
          {
            type: "transfer",
            address: RECIPIENT,
            peer: SENDER,
            asset: { type: "native" },
            amount: 1000000n,
          },
        ],
      },
    ]);
  });

  it("emits a single incoming operation with no peer when the sender is a contract", async () => {
    // GIVEN
    getBlockTransactionEventsMock.mockResolvedValue([
      {
        hash: "1a".repeat(32),
        sender: SENDER,
        cost: "400",
        result: {
          outcome: "success",
          events: [
            {
              tag: "Transferred",
              amount: "5000000",
              from: { type: "AddressContract", address: { index: 1, subindex: 0 } },
              to: account(RECIPIENT),
            },
          ],
        },
      },
    ]);

    // WHEN
    const { transactions } = await getBlock(1000, CURRENCY);

    // THEN
    expect(transactions[0].operations).toEqual([
      { type: "transfer", address: RECIPIENT, asset: { type: "native" }, amount: 5000000n },
    ]);
  });

  it("emits no operations when both transfer parties are contracts", async () => {
    // GIVEN
    getBlockTransactionEventsMock.mockResolvedValue([
      {
        hash: "2b".repeat(32),
        sender: SENDER,
        cost: "400",
        result: {
          outcome: "success",
          events: [
            {
              tag: "Transferred",
              amount: "5000000",
              from: { type: "AddressContract", address: { index: 1, subindex: 0 } },
              to: { type: "AddressContract", address: { index: 2, subindex: 0 } },
            },
          ],
        },
      },
    ]);

    // WHEN
    const { transactions } = await getBlock(1000, CURRENCY);

    // THEN
    expect(transactions[0].operations).toEqual([]);
  });

  it("decodes the memo of a TransferMemo event into the transaction details", async () => {
    // GIVEN
    decodeMemoFromCborMock.mockReturnValue("Hello");
    getBlockTransactionEventsMock.mockResolvedValue([
      {
        hash: "bb".repeat(32),
        sender: SENDER,
        cost: "700",
        result: {
          outcome: "success",
          events: [
            {
              tag: "Transferred",
              amount: "2000000",
              from: account(SENDER),
              to: account(RECIPIENT),
            },
            { tag: "TransferMemo", memo: "6548656c6c6f" },
          ],
        },
      },
    ]);

    // WHEN
    const { transactions } = await getBlock(1000, CURRENCY);

    // THEN
    expect(decodeMemoFromCborMock).toHaveBeenCalledWith(Buffer.from("6548656c6c6f", "hex"));
    expect(transactions[0].details).toEqual({ memo: "Hello" });
    expect(transactions[0].operations).toHaveLength(2);
  });

  it("keeps fees and marks rejected transactions as failed with no operations", async () => {
    // GIVEN
    getBlockTransactionEventsMock.mockResolvedValue([
      {
        hash: "cc".repeat(32),
        sender: SENDER,
        cost: "500",
        result: { outcome: "reject", rejectReason: { tag: "AmountTooLarge" } },
      },
    ]);

    // WHEN
    const { transactions } = await getBlock(1000, CURRENCY);

    // THEN
    expect(transactions).toEqual([
      { hash: "cc".repeat(32), failed: true, fees: 500n, feesPayer: SENDER, operations: [] },
    ]);
  });

  it("represents non-transfer transaction types with no operations", async () => {
    // GIVEN
    getBlockTransactionEventsMock.mockResolvedValue([
      {
        hash: "dd".repeat(32),
        sender: SENDER,
        cost: "300",
        type: { type: "accountTransaction", contents: "registerData" },
        result: { outcome: "success", events: [{ tag: "DataRegistered", data: "abcd" }] },
      },
    ]);

    // WHEN
    const { transactions } = await getBlock(1000, CURRENCY);

    // THEN
    expect(transactions[0].operations).toEqual([]);
    expect(transactions[0].failed).toBe(false);
    expect(transactions[0].fees).toBe(300n);
    expect(transactions[0].details).toBeUndefined();
  });

  it("skips the memo when CBOR decoding fails but keeps the transfer operations", async () => {
    // GIVEN
    decodeMemoFromCborMock.mockImplementation(() => {
      throw new Error("bad cbor");
    });
    getBlockTransactionEventsMock.mockResolvedValue([
      {
        hash: "ee".repeat(32),
        sender: SENDER,
        cost: "700",
        result: {
          outcome: "success",
          events: [
            {
              tag: "Transferred",
              amount: "2000000",
              from: account(SENDER),
              to: account(RECIPIENT),
            },
            { tag: "TransferMemo", memo: "zz" },
          ],
        },
      },
    ]);

    // WHEN
    const { transactions } = await getBlock(1000, CURRENCY);

    // THEN
    expect(transactions[0].details).toBeUndefined();
    expect(transactions[0].operations).toHaveLength(2);
  });

  it("omits feesPayer when the summary has no sender", async () => {
    // GIVEN
    getBlockTransactionEventsMock.mockResolvedValue([
      {
        hash: "ff".repeat(32),
        sender: null,
        cost: "0",
        result: { outcome: "success", events: [] },
      },
    ]);

    // WHEN
    const { transactions } = await getBlock(1000, CURRENCY);

    // THEN
    expect(transactions[0]).toEqual({
      hash: "ff".repeat(32),
      failed: false,
      fees: 0n,
      operations: [],
    });
  });
});
