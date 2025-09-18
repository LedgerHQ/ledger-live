import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as externalNode from "../network/node/rpc.common";
import ledgerNode from "../network/node/ledger";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { lastBlock } from "./lastBlock";

describe("lastBlock", () => {
  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])("returns last block info using %s", async (_, type, node) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    jest.spyOn(node, "getBlockByHeight").mockResolvedValue({
      hash: "hash",
      height: 33,
      timestamp: new Date("2025-12-31").getTime(),
    });

    expect(await lastBlock({} as CryptoCurrency)).toEqual({
      hash: "hash",
      height: 33,
      time: new Date("2025-12-31"),
    });
  });
});
