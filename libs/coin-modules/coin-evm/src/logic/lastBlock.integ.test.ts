import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { lastBlock } from "./lastBlock";

describe("lastBlock", () => {
  it.each([
    ["an external node", { type: "external", uri: "https://ethereum-rpc.publicnode.com" }],
    ["a ledger node", { type: "ledger", explorerId: "eth" }],
  ])("returns last block info using %s", async (_, node) => {
    setCoinConfig(() => ({ info: { node } }) as EvmCoinConfig);

    const result = await lastBlock({} as CryptoCurrency);

    expect(result.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
