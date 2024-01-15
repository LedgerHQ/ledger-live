import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BitcoinLikeExplorer from "../explorer";

describe("Integration tests for bitcoin v4 explorer api", () => {
  it("Test API for btc", async () => {
    const explorer = new BitcoinLikeExplorer({
      cryptoCurrency: getCryptoCurrencyById("bitcoin"),
    });
    const params = {
      batch_size: 10000,
    };
    const txs = await explorer.fetchTxs(
      {
        account: 0,
        index: 0,
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      },
      params,
    );
    expect(txs.length).toBeGreaterThan(10);

    const fees = await explorer.getFees();
    expect(Object.keys(fees).length).toBeGreaterThan(3);

    const block = await explorer.getBlockByHeight(10000);
    expect(block?.hash).toEqual("0000000099c744455f58e6c6e98b671e1bf7f37346bfd4cf5d0274ad8ee660cb");
    expect(block?.height).toEqual(10000);

    const currentBlock = await explorer.getCurrentBlock();
    expect(currentBlock?.height).toBeGreaterThan(10000);
    expect(currentBlock?.hash.startsWith("0000")).toBeTruthy();

    const hex = await explorer.getTxHex(
      "8bae12b5f4c088d940733dcd1455efc6a3a69cf9340e17a981286d3778615684",
    );
    expect(hex).toEqual(
      "0100000001c858ba5f607d762fe5be1dfe97ddc121827895c2562c4348d69d02b91dbb408e010000008b4830450220446df4e6b875af246800c8c976de7cd6d7d95016c4a8f7bcdbba81679cbda242022100c1ccfacfeb5e83087894aa8d9e37b11f5c054a75d030d5bfd94d17c5bc953d4a0141045901f6367ea950a5665335065342b952c5d5d60607b3cdc6c69a03df1a6b915aa02eb5e07095a2548a98dcdd84d875c6a3e130bafadfd45e694a3474e71405a4ffffffff020000000000000000156a13636861726c6579206c6f766573206865696469400d0300000000001976a914b8268ce4d481413c4e848ff353cd16104291c45b88ac00000000",
    );
  }, 60000);
});
