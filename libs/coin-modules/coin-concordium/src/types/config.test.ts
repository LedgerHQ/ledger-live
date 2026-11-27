import { createFixtureConfig, createFixtureContext } from "../test/fixtures";
import { withConfig } from "./config";

describe("withConfig", () => {
  it("resolves the pinned config whatever currency id is asked for", async () => {
    const base = createFixtureContext();
    const config = createFixtureConfig({ enableTokens: true });
    const pinned = withConfig(base, config);

    await expect(pinned.config()).resolves.toBe(config);
    await expect(pinned.config("concordium")).resolves.toBe(config);
    await expect(pinned.config("concordium_testnet")).resolves.toBe(config);
  });

  it("keeps the logger and the other members of the context", () => {
    const logger = jest.fn();
    const signal = new AbortController().signal;
    const base = { ...createFixtureContext(), logger, signal };

    const pinned = withConfig(base, createFixtureConfig());

    expect(pinned.logger).toBe(logger);
    expect(pinned).toMatchObject({ signal });
  });

  it("leaves the original context unchanged", async () => {
    const base = createFixtureContext();
    const baseConfig = await base.config();

    withConfig(base, createFixtureConfig({ enableTokens: true }));

    await expect(base.config()).resolves.toEqual(baseConfig);
  });
});
