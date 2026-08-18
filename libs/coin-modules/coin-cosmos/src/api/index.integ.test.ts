import type { CosmosCoinConfig, CosmosContext } from "../config";
import { createApi } from "./index";

// Exercises the wired CoinModuleApi end-to-end against the live Cosmos Hub LCD proxy: the context
// resolves the runtime coinConfig and the api builds the CosmosAPI internally, so this proves the
// factory wiring (not just the individual logic fns tested in the per-method integ suites).
const HUB = "https://cosmoshub4.coin.ledger.com";
const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";

// Flat runtime config; the declared CosmosCoinConfig wraps each field in ConfigInfo, so cast through
// unknown — same shape makeTestApi builds (see src/test/msw.mock.ts).
const config = {
  lcd: HUB,
  minGasPrice: 0.025,
  status: { type: "active" as const },
} as unknown as CosmosCoinConfig;

// The `currencyId` chain selector is captured at createApi; the context carries only config + logger.
const context: CosmosContext = {
  config: async () => config,
  logger: () => {},
};

describe("createApi (integ, Cosmos Hub)", () => {
  const api = createApi("cosmos");

  it("getBalance returns a native balance via the wired api", async () => {
    const balances = await api.getBalance(context, ADDR);

    expect(balances.some(b => b.asset.type === "native")).toBe(true);
  });

  it("lastBlock returns a positive height via the wired api", async () => {
    const block = await api.lastBlock(context);

    expect(Number(block.height)).toBeGreaterThan(0);
  });
});
