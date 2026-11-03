import { afterEach, describe, expect, it } from "bun:test";
import { getEnv, getEnvDefault, setEnv } from "@shared/env";
import { applySwapApiBaseOverride } from "./swap-api-base";

const STAGING_SWAP_API = "https://global.api.stg.ledger-test.com/swap/v5";

describe("applySwapApiBaseOverride", () => {
  afterEach(() => setEnv("SWAP_API_BASE", getEnvDefault("SWAP_API_BASE")));

  it("points the Swap API at SWAP_API_BASE", () => {
    applySwapApiBaseOverride({ SWAP_API_BASE: STAGING_SWAP_API });
    expect(getEnv("SWAP_API_BASE")).toBe(STAGING_SWAP_API);
  });

  it("keeps the production Swap API without SWAP_API_BASE", () => {
    applySwapApiBaseOverride({});
    expect(getEnv("SWAP_API_BASE")).toBe("https://swap.ledger.com/v5");
  });

  it("ignores an empty SWAP_API_BASE", () => {
    applySwapApiBaseOverride({ SWAP_API_BASE: "" });
    expect(getEnv("SWAP_API_BASE")).toBe("https://swap.ledger.com/v5");
  });
});
