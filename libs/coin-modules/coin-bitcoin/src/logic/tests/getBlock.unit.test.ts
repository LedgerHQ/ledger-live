import * as networkMod from "@ledgerhq/live-network/network";
import * as coinNetwork from "../../network";
import { getBlock } from "../getBlock";
import type { BitcoinContext } from "../../api/config";

jest.mock("../../network");

const mockedGetBlockByHeight = coinNetwork.getBlockByHeight as jest.MockedFunction<
  typeof coinNetwork.getBlockByHeight
>;
const netSpy = jest.spyOn(networkMod, "default");

const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

beforeEach(() => {
  jest.resetAllMocks();
});

describe("logic/getBlock", () => {
  it("maps inputs to negative transfers and outputs to positive transfers", async () => {
    mockedGetBlockByHeight.mockResolvedValue({
      height: 500,
      hash: "b500",
      time: "2024-01-01T00:00:00Z",
    });
    // a normal spend + a coinbase tx (input without address/value)
    const txs = [
      {
        id: "tx1",
        hash: "tx1",
        fees: "100",
        inputs: [{ address: "in1", value: "1000", output_hash: "p", output_index: 0, sequence: 0 }],
        outputs: [
          { address: "out1", value: "700", output_hash: "tx1", output_index: 0 },
          { address: "change1", value: "200", output_hash: "tx1", output_index: 1 },
        ],
      },
      {
        id: "cb",
        hash: "cb",
        fees: "0",
        inputs: [{ coinbase: "deadbeef", sequence: 4294967295 }], // no address/value
        outputs: [{ address: "miner", value: "625000000", output_hash: "cb", output_index: 0 }],
      },
    ];
    netSpy.mockResolvedValue({ data: txs } as unknown as ReturnType<typeof networkMod.default>);

    const block = await getBlock(context, "bitcoin", 500);

    expect(block.info).toEqual({
      height: 500,
      hash: "b500",
      time: new Date("2024-01-01T00:00:00Z"),
    });
    expect(block.transactions).toHaveLength(2);

    const [tx1, cb] = block.transactions;
    expect(tx1.hash).toBe("tx1");
    expect(tx1.failed).toBe(false);
    expect(tx1.fees).toBe(100n);
    expect(tx1.operations).toEqual([
      { type: "transfer", address: "in1", asset: { type: "native" }, amount: -1000n },
      { type: "transfer", address: "out1", asset: { type: "native" }, amount: 700n },
      { type: "transfer", address: "change1", asset: { type: "native" }, amount: 200n },
    ]);

    // coinbase: input has no address → only the output transfer is emitted
    expect(cb.operations).toEqual([
      { type: "transfer", address: "miner", asset: { type: "native" }, amount: 625000000n },
    ]);
  });

  it("returns an empty transactions array for an empty block response", async () => {
    mockedGetBlockByHeight.mockResolvedValue({
      height: 1,
      hash: "b1",
      time: "2009-01-03T18:15:05Z",
    });
    netSpy.mockResolvedValue({ data: [] } as unknown as ReturnType<typeof networkMod.default>);

    const block = await getBlock(context, "bitcoin", 1);
    expect(block.transactions).toEqual([]);
    expect(block.info.height).toBe(1);
  });
});
