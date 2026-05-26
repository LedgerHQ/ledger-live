import { getEnv } from "@ledgerhq/live-env";
import { listOperations } from "./listOperations";
import {
  server,
  filecoinHandlers,
  TEST_ENDPOINT,

} from "../tests/helpers/msw-api.mock";
import {
  TEST_ADDRESSES,
  TEST_BLOCK_HEIGHTS,
  createMockTransactionResponse,
  createMockERC20Transfer,
} from "../../test/fixtures";

jest.mock("@ledgerhq/live-env");
jest.mocked(getEnv).mockImplementation((key: string) => {
  if (key === "API_FILECOIN_ENDPOINT") return TEST_ENDPOINT;
  return "" as any;
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("listOperations (MSW integration)", () => {
  it("returns empty page for address with no transactions", async () => {
    server.use(
      ...filecoinHandlers({
        getTransactions: () => ({ txs: [], metadata: { limit: 50, offset: 0 } }),
        getERC20Transactions: () => ({ txs: [] }),
      }),
    );

    const result = await listOperations("f1empty", { minHeight: 0 });
    expect(result.items).toHaveLength(0);
    expect(result.next).toBeUndefined();
  });

  it("maps native IN transaction from API response", async () => {
    server.use(
      ...filecoinHandlers({
        getTransactions: () => ({
          txs: [
            createMockTransactionResponse({
              to: TEST_ADDRESSES.F1_ADDRESS,
              from: TEST_ADDRESSES.RECIPIENT_F1,
              amount: "2000000000000000000",
              hash: "bafy2in",
              height: TEST_BLOCK_HEIGHTS.CURRENT,
              timestamp: 1716000000,
            }),
          ],
          metadata: { limit: 50, offset: 0 },
        }),
        getERC20Transactions: () => ({ txs: [] }),
      }),
    );

    const result = await listOperations(TEST_ADDRESSES.F1_ADDRESS, { minHeight: 0 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("IN");
    expect(result.items[0].value).toBe(2000000000000000000n);
    expect(result.items[0].asset).toEqual({ type: "native" });
    expect(result.items[0].senders).toContain(TEST_ADDRESSES.RECIPIENT_F1);
    expect(result.items[0].recipients).toContain(TEST_ADDRESSES.F1_ADDRESS);
  });

  it("maps native OUT transaction with fees", async () => {
    server.use(
      ...filecoinHandlers({
        getTransactions: () => ({
          txs: [
            createMockTransactionResponse({
              from: TEST_ADDRESSES.F1_ADDRESS,
              to: TEST_ADDRESSES.RECIPIENT_F1,
              amount: "500000000000000000",
              hash: "bafy2out",
              fee_data: {
                MinerFee: { MinerAddress: "f0", Amount: "50000" },
                OverEstimationBurnFee: { BurnAddress: "f0", Amount: "0" },
                BurnFee: { BurnAddress: "f0", Amount: "0" },
                TotalCost: "50000",
              },
            }),
          ],
          metadata: { limit: 50, offset: 0 },
        }),
        getERC20Transactions: () => ({ txs: [] }),
      }),
    );

    const result = await listOperations(TEST_ADDRESSES.F1_ADDRESS, { minHeight: 0 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("OUT");
    // OUT value = amount + fee
    expect(result.items[0].value).toBe(500000000000000000n + 50000n);
  });

  it("merges native and ERC-20 operations sorted by block height", async () => {
    server.use(
      ...filecoinHandlers({
        getTransactions: () => ({
          txs: [
            createMockTransactionResponse({
              to: TEST_ADDRESSES.F1_ADDRESS,
              from: TEST_ADDRESSES.RECIPIENT_F1,
              amount: "1000",
              hash: "native1",
              height: 100,
              timestamp: 1700000000,
            }),
          ],
          metadata: { limit: 50, offset: 0 },
        }),
        getERC20Transactions: () => ({
          txs: [
            createMockERC20Transfer({
              from: TEST_ADDRESSES.F1_ADDRESS,
              to: TEST_ADDRESSES.RECIPIENT_F4,
              amount: "500",
              tx_hash: "erc20_1",
              height: 200,
              timestamp: 1700000100,
              contract_address: "0xtoken",
            }),
          ],
        }),
      }),
    );

    const result = await listOperations(TEST_ADDRESSES.F1_ADDRESS, { minHeight: 0 });

    expect(result.items).toHaveLength(2);
    // ERC-20 op at height 200 should come first (descending)
    expect(result.items[0].asset).toEqual({ type: "token", assetReference: "0xtoken" });
    expect(result.items[1].asset).toEqual({ type: "native" });
  });

  it("paginates when results fill a page", async () => {
    const txs = Array.from({ length: 50 }, (_, i) =>
      createMockTransactionResponse({
        to: TEST_ADDRESSES.F1_ADDRESS,
        from: TEST_ADDRESSES.RECIPIENT_F1,
        hash: `hash${i}`,
        height: 1000 + i,
        timestamp: 1700000000 + i,
      }),
    );

    server.use(
      ...filecoinHandlers({
        getTransactions: () => ({ txs, metadata: { limit: 50, offset: 0 } }),
        getERC20Transactions: () => ({ txs: [] }),
      }),
    );

    const result = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
      limit: 50,
    });

    expect(result.next).toBeDefined();

    const cursor = JSON.parse(Buffer.from(result.next!, "base64").toString("utf8"));
    expect(cursor.offset).toBe(50);
    expect(cursor.lastHeight).toBe(0);
  });
});
