import { getCoinConfig, setCoinConfig } from "./config";
import type { CoinConfig } from "./config";

describe("coin config", () => {
  it("refuses to answer before the host app has wired one in", () => {
    expect(() => getCoinConfig("zcash")).toThrow("Zcash module config not set");
  });

  it("asks the host app's resolver, per currency", () => {
    const info = { status: { type: "active" } } as never;
    const resolver = jest.fn(() => ({ info })) as unknown as CoinConfig;
    setCoinConfig(resolver);

    expect(getCoinConfig("zcash").info).toBe(info);
    expect(resolver).toHaveBeenCalledWith("zcash");
  });
});
