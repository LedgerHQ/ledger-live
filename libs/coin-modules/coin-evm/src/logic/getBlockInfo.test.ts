import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as externalNode from "../network/node/rpc.common";
import ledgerNode from "../network/node/ledger";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { getBlockInfo } from "./getBlockInfo";

describe("getBlockInfo", () => {
  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])("returns block info using %s", async (_, type, node) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    jest.spyOn(node, "getBlockByHeight").mockResolvedValue({
      hash: "0xdef456",
      height: 99999,
      timestamp: new Date("2025-02-20T15:45:00Z").getTime(),
    });

    expect(await getBlockInfo({} as CryptoCurrency, 99999)).toEqual({
      hash: "0xdef456",
      height: 99999,
      time: new Date("2025-02-20T15:45:00Z"),
    });
  });
});
