import { getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { fetchAccountTransitionPage } from "../network/utils";
import { listPublicOperationsPage } from "./listPublicOperations";

jest.mock("../network/utils");

const mockFetchPage = jest.mocked(fetchAccountTransitionPage);
const mockConfig = getMockedConfig("mainnet");

const transition = (overrides: Parameters<typeof getMockedTransaction>[0]) =>
  getMockedTransaction(overrides);

describe("listPublicOperationsPage", () => {
  const address = "aleo1test";

  beforeEach(() => jest.clearAllMocks());

  const page = () =>
    listPublicOperationsPage({
      config: mockConfig,
      address,
      fromBlock: 100,
      toBlock: 200,
      minTransactions: 2,
    });

  it("forwards the block window to the explorer walk", async () => {
    mockFetchPage.mockResolvedValue({ transitions: [], nextBlock: null });

    await page();

    expect(mockFetchPage).toHaveBeenCalledWith(
      expect.objectContaining({ fromBlock: 100, toBlock: 200, minTransactions: 2 }),
    );
  });

  it("hands the resume block back untouched", async () => {
    mockFetchPage.mockResolvedValue({
      transitions: [transition({ transaction_id: "tx1", transition_id: "au1a" })],
      nextBlock: 150,
    });

    const { nextBlock } = await page();

    expect(nextBlock).toBe(150);
  });

  it("collapses a multi-transition transaction to a single row", async () => {
    mockFetchPage.mockResolvedValue({
      transitions: [
        transition({ transaction_id: "tx1", transition_id: "au1a" }),
        transition({ transaction_id: "tx1", transition_id: "au1b" }),
        transition({ transaction_id: "tx2", transition_id: "au1c" }),
      ],
      nextBlock: null,
    });

    const { transactions } = await page();

    expect(transactions.map(tx => tx.transaction_id)).toEqual(["tx1", "tx2"]);
  });

  it("treats a padded transaction_id as the same transaction", async () => {
    mockFetchPage.mockResolvedValue({
      transitions: [
        transition({ transaction_id: "tx1", transition_id: "au1a" }),
        transition({ transaction_id: " tx1 ", transition_id: "au1b" }),
      ],
      nextBlock: null,
    });

    const { transactions } = await page();

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

    mockFetchPage.mockResolvedValue({ transitions: [inner, real], nextBlock: null });

    const { transactions } = await page();

    expect(transactions).toEqual([real]);
  });

  it("picks the same representative whatever order the explorer returns", async () => {
    const first = transition({ transaction_id: "tx1", transition_id: "au1aaa" });
    const second = transition({ transaction_id: "tx1", transition_id: "au1bbb" });

    mockFetchPage.mockResolvedValueOnce({ transitions: [first, second], nextBlock: null });
    const forward = await page();

    mockFetchPage.mockResolvedValueOnce({ transitions: [second, first], nextBlock: null });
    const reversed = await page();

    expect(forward.transactions).toEqual(reversed.transactions);
    expect(forward.transactions).toEqual([first]);
  });
});
