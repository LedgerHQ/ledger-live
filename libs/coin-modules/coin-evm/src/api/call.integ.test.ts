import type { EvmConfigInfo } from "../config";
import { createMockEvmContext } from "../fixtures/context.fixtures";
import { isHexString } from "../utils";
import { createApi } from "./index";

// Exercises `call` (eth_call) against a live external RPC. Native USDC on Arbitrum is a
// stable, well-known ERC-20 — mirrors index.arbitrum.integ.test.ts (real node, no mocks).
const USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const DECIMALS = "0x313ce567"; // decimals()
const TOTAL_SUPPLY = "0x18160ddd"; // totalSupply()

describe("call (eth_call) on an external node", () => {
  let api: ReturnType<typeof createApi>;

  const config: Partial<EvmConfigInfo> = {
    node: {
      type: "external",
      uri: "https://arbitrum.coin.ledger.com",
    },
  };

  beforeAll(() => {
    api = createApi("arbitrum");
  });

  it("reads USDC decimals()", async () => {
    const result = await api.call(createMockEvmContext(config), { to: USDC, data: DECIMALS });
    expect(isHexString(result)).toBe(true);
    expect(BigInt(result)).toBe(6n);
  });

  it("reads a non-zero USDC totalSupply()", async () => {
    const result = await api.call(createMockEvmContext(config), {
      to: USDC,
      data: TOTAL_SUPPLY,
    });
    expect(isHexString(result)).toBe(true);
    expect(BigInt(result)).toBeGreaterThan(0n);
  });

  it("honors an explicit block tag", async () => {
    const result = await api.call(createMockEvmContext(config), {
      to: USDC,
      data: DECIMALS,
      block: "latest",
    });
    expect(isHexString(result)).toBe(true);
    expect(BigInt(result)).toBe(6n);
  });
});
