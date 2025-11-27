import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as externalNode from "../network/node/rpc.common";
import ledgerNode from "../network/node/ledger";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { getBlock } from "./getBlock";

describe("getBlock", () => {
  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])("returns block info using %s", async (_, type, node) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    jest.spyOn(node, "getBlockByHeight").mockResolvedValue({
      hash: "0xabc123",
      height: 12345,
      timestamp: new Date("2025-01-15T10:30:00Z").getTime(),
    });

    expect(await getBlock({} as CryptoCurrency, 12345)).toEqual({
      info: {
        hash: "0xabc123",
        height: 12345,
        time: new Date("2025-01-15T10:30:00Z"),
      },
      transactions: [],
    });
  });
});
