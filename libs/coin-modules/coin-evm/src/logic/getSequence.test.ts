import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as externalNode from "../network/node/rpc.common";
import ledgerNode from "../network/node/ledger";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { getSequence } from "./getSequence";

describe("getSequence", () => {
  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])("returns next sequence for an address using %s", async (_, type, node) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    jest.spyOn(node, "getTransactionCount").mockResolvedValue(42);

    expect(await getSequence({} as CryptoCurrency, "")).toEqual(42n);
  });
});
