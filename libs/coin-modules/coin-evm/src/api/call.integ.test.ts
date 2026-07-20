import { EvmConfig } from "../config";
import { isHexString } from "../utils";
import { createApi } from "./index";

// The read-only `call` (eth_call) API is only supported on external RPC nodes, so this
// exercises an external node. Native USDC on Arbitrum is a stable, well-known ERC-20.
const USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const DECIMALS = "0x313ce567"; // decimals()
const TOTAL_SUPPLY = "0x18160ddd"; // totalSupply()

describe("call (eth_call) on an external node", () => {
  const api = createApi(
    { node: { type: "external", uri: "https://arbitrum.coin.ledger.com" } } as EvmConfig,
    "arbitrum",
  );

  it("reads USDC decimals()", async () => {
    const result = await api.call({ to: USDC, data: DECIMALS });
    expect(isHexString(result)).toBe(true);
    expect(BigInt(result)).toBe(6n);
  });

  it("reads a non-zero USDC totalSupply()", async () => {
    const result = await api.call({ to: USDC, data: TOTAL_SUPPLY });
    expect(isHexString(result)).toBe(true);
    expect(BigInt(result)).toBeGreaterThan(0n);
  });

  it("honors an explicit block tag", async () => {
    const result = await api.call({ to: USDC, data: DECIMALS, block: "latest" });
    expect(isHexString(result)).toBe(true);
    expect(BigInt(result)).toBe(6n);
  });
});
