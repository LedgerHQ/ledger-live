import { http, HttpResponse } from "msw";
import { getBlock } from "../getBlock";
import {
  blockHandler,
  blockTxsHandler,
  explorerUrl,
  makeBlock,
  makeTx,
  server,
  testContext,
  useMswServer,
} from "./helpers/msw";

useMswServer();

describe("getBlock (explorer wire format)", () => {
  it("calls both block endpoints and returns one transaction per payload entry", async () => {
    const calls: string[] = [];
    const txs = [
      makeTx("b1fea52486ce0c62bb442b530a3f0132b826c74e473d1f2c220bfa78111c5082", {
        inputs: [
          { output_hash: null, output_index: null, value: null, address: null, coinbase: "04ff" },
        ],
        outputs: [
          { output_index: 0, value: "5000000000", address: "1PSSGeFHDnKNxiEyFrD1wcEaHr9hrQDDWc" },
        ],
      }),
      makeTx("f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16", {
        fees: "0",
        inputs: [
          {
            output_hash: "0437cd7f8525ceed2324359c2d0ba26006d92d856a9c20fa0241106ee5a597c9",
            output_index: 0,
            value: "5000000000",
            address: "12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S",
            coinbase: null,
          },
        ],
        outputs: [
          { output_index: 0, value: "1000000000", address: "1Q2TWHE3GMdB6BZKafqwxXtWAWgFt5Jvm3" },
          { output_index: 1, value: "4000000000", address: "12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S" },
        ],
      }),
    ];
    server.use(
      http.get(`${explorerUrl()}/block/170`, () => {
        calls.push("block");
        return HttpResponse.json([makeBlock(170, { txs: txs.map(tx => tx.hash) })]);
      }),
      http.get(`${explorerUrl()}/block/170/txs`, () => {
        calls.push("txs");
        return HttpResponse.json(txs);
      }),
    );

    const block = await getBlock(testContext(), "bitcoin", 170);

    expect(calls.sort()).toEqual(["block", "txs"]);
    expect(block.info.height).toBe(170);
    expect(block.transactions).toHaveLength(txs.length);
    expect(block.transactions[1].operations).toEqual([
      {
        type: "transfer",
        address: "12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S",
        asset: { type: "native" },
        amount: -1000000000n,
      },
      {
        type: "transfer",
        address: "1Q2TWHE3GMdB6BZKafqwxXtWAWgFt5Jvm3",
        asset: { type: "native" },
        amount: 1000000000n,
      },
    ]);
  });

  it("throws when the block does not exist", async () => {
    server.use(blockHandler(99_999_999, []), blockTxsHandler(99_999_999, []));
    await expect(getBlock(testContext(), "bitcoin", 99_999_999)).rejects.toThrow("not found");
  });
});
