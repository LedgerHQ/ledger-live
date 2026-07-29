import type { TX } from "@ledgerhq/wallet-btc/index";
import { listOperations } from "./listOperations";
import { fetchTransparentTxs } from "../../network/explorer";

jest.mock("../../network/explorer");

const mockFetch = fetchTransparentTxs as jest.MockedFunction<typeof fetchTransparentTxs>;

// A real mainnet t-address: the paging and mapping only run for addresses the
// Base58Check validator accepts.
const OWN = "t1Qmwyih5F7Mw6Vts4tSnXuA2o3NgJPYNgP";
const OTHER = "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F";
const TXID = "cc".repeat(32);
const PREV = "ab".repeat(32);

function tx(overrides: Partial<TX> = {}): TX {
  return {
    id: TXID,
    account: 0,
    index: 0,
    received_at: "2026-01-02T03:04:05Z",
    block: { height: 3_000_000, hash: "dd".repeat(32), time: "2026-01-02T04:00:00Z" },
    address: OWN,
    inputs: [],
    outputs: [],
    fees: 1000,
    ...overrides,
  } as TX;
}

const input = (address: string, value: string, outputIndex = 0) =>
  ({
    address,
    value,
    output_hash: PREV,
    output_index: outputIndex,
    sequence: 0xfffffffe,
  }) as TX["inputs"][number];

const output = (address: string, value: string, outputIndex = 0) =>
  ({
    address,
    value,
    output_hash: TXID,
    output_index: outputIndex,
    block_height: 3_000_000,
    rbf: false,
  }) as TX["outputs"][number];

const page = (txs: TX[], next: string | null = null) => ({ txs, next });

beforeEach(() => jest.clearAllMocks());

describe("listOperations", () => {
  it("reports an incoming payment", async () => {
    mockFetch.mockResolvedValue(
      page([tx({ inputs: [input(OTHER, "5000")], outputs: [output(OWN, "4000")] })]),
    );

    const { items } = await listOperations(OWN, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: `${TXID}-IN`,
      type: "IN",
      value: 4000n,
      senders: [OTHER],
      recipients: [OWN],
    });
    expect(items[0].tx).toMatchObject({ hash: TXID, fees: 1000n, failed: false });
    expect(items[0].tx.block.height).toBe(3_000_000);
  });

  it("nets the change out of an outgoing payment, so the value is amount + fees", async () => {
    mockFetch.mockResolvedValue(
      page([
        tx({
          inputs: [input(OWN, "10000")],
          outputs: [output(OTHER, "6000"), output(OWN, "3000", 1)],
        }),
      ]),
    );

    const { items } = await listOperations(OWN, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: `${TXID}-OUT`, type: "OUT", value: 7000n });
  });

  it("reports a send to self as a single operation worth the fee", async () => {
    mockFetch.mockResolvedValue(
      page([tx({ inputs: [input(OWN, "10000")], outputs: [output(OWN, "9000")] })]),
    );

    const { items } = await listOperations(OWN, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "OUT", value: 1000n });
  });

  it("reports the transparent side of a shielding transaction", async () => {
    // t→z: value leaves to an Orchard output the explorer cannot see.
    mockFetch.mockResolvedValue(
      page([tx({ inputs: [input(OWN, "10000")], outputs: [output(OWN, "1000")] })]),
    );

    const { items } = await listOperations(OWN, { minHeight: 0 });

    expect(items[0]).toMatchObject({ type: "OUT", value: 9000n });
  });

  it("ignores a transaction the address takes no part in", async () => {
    mockFetch.mockResolvedValue(
      page([tx({ inputs: [input(OTHER, "5000")], outputs: [output(OTHER, "4000")] })]),
    );

    const { items } = await listOperations(OWN, { minHeight: 0 });

    expect(items).toEqual([]);
  });

  it("propagates the explorer's paging token as the cursor", async () => {
    mockFetch.mockResolvedValue(page([], "token-2"));

    const { next } = await listOperations(OWN, { minHeight: 0 });

    expect(next).toBe("token-2");
  });

  it("reports no cursor once the history is exhausted", async () => {
    mockFetch.mockResolvedValue(page([]));

    const { next } = await listOperations(OWN, { minHeight: 0 });

    expect(next).toBeUndefined();
  });

  it("resumes from the cursor and the height it is given", async () => {
    mockFetch.mockResolvedValue(page([]));

    await listOperations(OWN, { minHeight: 2_900_000, cursor: "token-1", limit: 50 });

    expect(mockFetch).toHaveBeenCalledWith(OWN, {
      fromHeight: 2_900_000,
      token: "token-1",
      batchSize: 50,
    });
  });

  it("refuses a unified address instead of answering for its transparent receiver only", async () => {
    await expect(listOperations("u1abcdef", { minHeight: 0 })).rejects.toThrow("a viewing key");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
