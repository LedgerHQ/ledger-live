import { ETH, update } from "../fakeService.mock";
import { toAccountOperations } from "./map";

const USDT = "ethereum/erc20/usdt";

describe("toAccountOperations", () => {
  it("maps a receive to an IN row carrying the fee, with no senders nor recipients", () => {
    expect(toAccountOperations(ETH, [update(ETH)])).toEqual({
      rows: [
        {
          id: "ethereum-0xabc-IN",
          hash: "0xabc",
          type: "IN",
          assetId: "ethereum",
          value: "10",
          fee: "1",
          senders: [],
          recipients: [],
          blockHeight: 100,
          date: "2026-10-01T00:00:00.000Z",
          hasFailed: false,
        },
      ],
      unmapped: 0,
      unreadable: 0,
    });
  });

  it("types from the native change sign and puts each token change after its parent", () => {
    const { rows, unmapped } = toAccountOperations(ETH, [
      update(ETH, {
        deltas: [
          { asset: "native", amount: "-4" },
          { asset: "token", cal_id: USDT, amount: "-3" },
          { asset: "token", cal_id: USDT, amount: "-2" },
          { asset: "token", cal_id: null, amount: "7" },
        ],
      }),
      update(ETH, {
        tx: { hash: "0xdef" },
        deltas: [{ asset: "token", cal_id: USDT, amount: "9" }],
      }),
    ]);

    expect(
      rows.map(({ id, type, value, fee, parentId }) => ({ id, type, value, fee, parentId })),
    ).toEqual([
      { id: "ethereum-0xabc-OUT", type: "OUT", value: "4", fee: "1", parentId: undefined },
      {
        id: `${USDT}-0xabc-OUT`,
        type: "OUT",
        value: "5",
        fee: "0",
        parentId: "ethereum-0xabc-OUT",
      },
      { id: "ethereum-0xdef-NONE", type: "NONE", value: "0", fee: "1", parentId: undefined },
      {
        id: `${USDT}-0xdef-IN`,
        type: "IN",
        value: "9",
        fee: "0",
        parentId: "ethereum-0xdef-NONE",
      },
    ]);
    expect(unmapped).toBe(1);
  });

  it("puts pending updates first, with no block height", () => {
    const { rows } = toAccountOperations(ETH, [
      update(ETH, { tx: { hash: "0x1" } }),
      update(ETH, { tx: { hash: "0x2" }, block: null }),
    ]);
    expect(rows.map(row => [row.hash, row.blockHeight])).toEqual([
      ["0x2", null],
      ["0x1", 100],
    ]);
  });

  it.each([
    [42, 42],
    [{ hash: "0xb" }, 0],
    ["0xb", 0],
  ])("reads the block %j at height %j", (block, height) => {
    expect(toAccountOperations(ETH, [update(ETH, { block })]).rows[0].blockHeight).toBe(height);
  });

  it("counts an update with an unreadable amount or date and leaves it out", () => {
    expect(
      toAccountOperations(ETH, [
        update(ETH, { fee: { asset: "native", amount: "1.5" } }),
        update(ETH, { time: "yesterday" }),
        update(ETH, { tx: { hash: "0x2" } }),
      ]),
    ).toMatchObject({ rows: [{ hash: "0x2" }], unreadable: 2 });
  });
});
