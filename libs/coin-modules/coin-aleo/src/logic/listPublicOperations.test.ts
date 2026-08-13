import { getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { fetchAccountTransactionsFromHeight } from "../network/utils";
import { listPublicOperations } from "./listPublicOperations";

jest.mock("../network/utils");

const mockFetch = jest.mocked(fetchAccountTransactionsFromHeight);
const mockConfig = getMockedConfig("mainnet");

const transition = (overrides: Parameters<typeof getMockedTransaction>[0]) =>
  getMockedTransaction(overrides);

describe("listPublicOperations", () => {
  const address = "aleo1test";

  beforeEach(() => jest.clearAllMocks());

  it("always fetches every page, whatever the caller asked for", async () => {
    mockFetch.mockResolvedValue({ transactions: [], nextCursor: null });

    await listPublicOperations({ config: mockConfig, address, minBlockHeight: 10, limit: 3 });

    expect(mockFetch).toHaveBeenCalledWith({
      config: mockConfig,
      address,
      fetchAllPages: true,
      minBlockHeight: 10,
      limit: 3,
    });
  });

  it("collapses a multi-transition transaction to a single row", async () => {
    mockFetch.mockResolvedValue({
      transactions: [
        transition({ transaction_id: "tx1", transition_id: "au1a" }),
        transition({ transaction_id: "tx1", transition_id: "au1b" }),
        transition({ transaction_id: "tx2", transition_id: "au1c" }),
      ],
      nextCursor: null,
    });

    const { transactions } = await listPublicOperations({
      config: mockConfig,
      address,
      minBlockHeight: 0,
    });

    expect(transactions.map(tx => tx.transaction_id)).toEqual(["tx1", "tx2"]);
  });

  it("treats a padded transaction_id as the same transaction", async () => {
    mockFetch.mockResolvedValue({
      transactions: [
        transition({ transaction_id: "tx1", transition_id: "au1a" }),
        transition({ transaction_id: " tx1 ", transition_id: "au1b" }),
      ],
      nextCursor: null,
    });

    const { transactions } = await listPublicOperations({
      config: mockConfig,
      address,
      minBlockHeight: 0,
    });

    expect(transactions).toHaveLength(1);
  });

  it("prefers the transition carrying an address over a bare inner transition", async () => {
    const inner = transition({
      transaction_id: "tx1",
      transition_id: "au1a",
      function_id: "batch_call",
      sender_address: "",
      recipient_address: "",
    });
    const real = transition({ transaction_id: "tx1", transition_id: "au1b" });

    mockFetch.mockResolvedValue({ transactions: [inner, real], nextCursor: null });

    const { transactions } = await listPublicOperations({
      config: mockConfig,
      address,
      minBlockHeight: 0,
    });

    expect(transactions).toEqual([real]);
  });

  it("picks the same representative whatever order the explorer returns", async () => {
    const first = transition({ transaction_id: "tx1", transition_id: "au1aaa" });
    const second = transition({ transaction_id: "tx1", transition_id: "au1bbb" });

    mockFetch.mockResolvedValueOnce({ transactions: [first, second], nextCursor: null });
    const forward = await listPublicOperations({ config: mockConfig, address, minBlockHeight: 0 });

    mockFetch.mockResolvedValueOnce({ transactions: [second, first], nextCursor: null });
    const reversed = await listPublicOperations({ config: mockConfig, address, minBlockHeight: 0 });

    expect(forward.transactions).toEqual(reversed.transactions);
    expect(forward.transactions).toEqual([first]);
  });

  it("passes the explorer cursor through untouched", async () => {
    mockFetch.mockResolvedValue({ transactions: [], nextCursor: "12345" });

    const { nextCursor } = await listPublicOperations({
      config: mockConfig,
      address,
      minBlockHeight: 0,
    });

    expect(nextCursor).toBe("12345");
  });
});
