import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getTxHistory } from "../network/indexer";
import type { IconTransactionType } from "../network/types";
import { LIMIT } from "../constants";
import { listOperations } from "./listOperations";

jest.mock("../network/indexer");

const currency = { id: "icon" } as CryptoCurrency;
const address = "hx123";

const buildTransaction = (overrides: Partial<IconTransactionType> = {}): IconTransactionType =>
  ({
    hash: "0xhash",
    from_address: address,
    to_address: "hx456",
    value: "0x3e8",
    transaction_fee: "0xa",
    block_number: 12345,
    block_timestamp: 1609459200000000,
    status: "0x1",
    ...overrides,
  }) as IconTransactionType;

describe("listOperations", () => {
  const getTxHistoryMock = jest.mocked(getTxHistory);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps an outgoing transaction to a core operation without fees in its value", async () => {
    getTxHistoryMock.mockResolvedValue([buildTransaction()]);

    const { items } = await listOperations(currency, address, { minHeight: 0 });

    const date = new Date(1609459200000);
    expect(items).toEqual([
      {
        id: "0xhash",
        type: "OUT",
        senders: [address],
        recipients: ["hx456"],
        value: 1000n,
        asset: { type: "native" },
        details: { hasValue: true },
        tx: {
          hash: "0xhash",
          block: { height: 12345, hash: "", time: date },
          fees: 10n,
          date,
          failed: false,
        },
      },
    ]);
  });

  it("maps an incoming transaction", async () => {
    getTxHistoryMock.mockResolvedValue([
      buildTransaction({ from_address: "hx456", to_address: address }),
    ]);

    const { items } = await listOperations(currency, address, { minHeight: 0 });

    expect(items[0]).toMatchObject({
      type: "IN",
      senders: ["hx456"],
      recipients: [address],
      value: 1000n,
    });
  });

  it("marks a transaction with a non success status as failed", async () => {
    getTxHistoryMock.mockResolvedValue([buildTransaction({ status: "0x0" })]);

    const { items } = await listOperations(currency, address, { minHeight: 0 });

    expect(items[0].tx.failed).toBe(true);
  });

  it("returns a zero value and flags a transaction without value", async () => {
    getTxHistoryMock.mockResolvedValue([buildTransaction({ value: "" })]);

    const { items } = await listOperations(currency, address, { minHeight: 0 });

    expect(items[0].value).toBe(0n);
    expect(items[0].details).toEqual({ hasValue: false });
  });

  it("starts at the first transaction with the default limit when no cursor is given", async () => {
    getTxHistoryMock.mockResolvedValue([]);

    await listOperations(currency, address, { minHeight: 0 });

    expect(getTxHistoryMock).toHaveBeenCalledWith(address, 0, currency, LIMIT);
  });

  it("skips the transactions before the cursor", async () => {
    getTxHistoryMock.mockResolvedValue([]);

    await listOperations(currency, address, { minHeight: 0, cursor: "200", limit: 50 });

    expect(getTxHistoryMock).toHaveBeenCalledWith(address, 200, currency, 50);
  });

  it("returns the next cursor when the page is full", async () => {
    getTxHistoryMock.mockResolvedValue([buildTransaction(), buildTransaction()]);

    const { next } = await listOperations(currency, address, {
      minHeight: 0,
      cursor: "4",
      limit: 2,
    });

    expect(next).toBe("6");
  });

  it("returns no next cursor when the page is not full", async () => {
    getTxHistoryMock.mockResolvedValue([buildTransaction()]);

    const { next } = await listOperations(currency, address, { minHeight: 0, limit: 2 });

    expect(next).toBeUndefined();
  });

  it("returns no next cursor when the page holds fewer transactions than the default limit", async () => {
    getTxHistoryMock.mockResolvedValue(Array.from({ length: LIMIT - 1 }, () => buildTransaction()));

    const { next } = await listOperations(currency, address, { minHeight: 0 });

    expect(next).toBeUndefined();
  });

  it("returns the next cursor when the page holds the default limit of transactions", async () => {
    getTxHistoryMock.mockResolvedValue(Array.from({ length: LIMIT }, () => buildTransaction()));

    const { next } = await listOperations(currency, address, { minHeight: 0 });

    expect(next).toBe(String(LIMIT));
  });

  it("rejects a minimum height", async () => {
    await expect(listOperations(currency, address, { minHeight: 1 })).rejects.toThrow(
      new InvalidParameterError("icon: listOperations does not support minHeight"),
    );
    await expect(listOperations(currency, address, { minHeight: 1 })).rejects.toBeInstanceOf(
      InvalidParameterError,
    );
    expect(getTxHistoryMock).not.toHaveBeenCalled();
  });

  it("rejects the ascending order", async () => {
    await expect(listOperations(currency, address, { minHeight: 0, order: "asc" })).rejects.toThrow(
      new InvalidParameterError("icon: listOperations does not support ascending order"),
    );
    await expect(
      listOperations(currency, address, { minHeight: 0, order: "asc" }),
    ).rejects.toBeInstanceOf(InvalidParameterError);
    expect(getTxHistoryMock).not.toHaveBeenCalled();
  });
});
