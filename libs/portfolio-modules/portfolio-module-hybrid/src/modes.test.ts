import { DEFAULT_PORTFOLIO_MODE, PORTFOLIO_MODES } from "@ledgerhq/portfolio-module-framework";
import type { PortfolioMode } from "@ledgerhq/portfolio-module-framework";
import { memoizeModes, resolveMode } from "./modes";

describe("memoizeModes", () => {
  it("asks the mode of each network once", async () => {
    const modeOf = jest.fn((network: string): PortfolioMode =>
      network === "bitcoin" ? "hybrid" : "remote",
    );
    const modes = memoizeModes(modeOf);

    await expect(
      Promise.all([modes("bitcoin"), modes("ethereum"), modes("bitcoin")]),
    ).resolves.toEqual(["hybrid", "remote", "hybrid"]);
    await expect(modes("ethereum")).resolves.toBe("remote");
    expect(modeOf).toHaveBeenCalledTimes(2);
  });

  it("resolves an asynchronous mode", async () => {
    const modes = memoizeModes(async (): Promise<PortfolioMode> => "hybrid");

    await expect(modes("bitcoin")).resolves.toBe("hybrid");
  });

  it.each<[string, () => PortfolioMode | Promise<PortfolioMode>]>([
    [
      "throws",
      () => {
        throw new Error("no config");
      },
    ],
    ["rejects", () => Promise.reject(new Error("no config"))],
    ["answers an unknown mode", () => "Remote" as PortfolioMode],
    ["answers nothing", () => undefined as unknown as PortfolioMode],
  ])("gives the default mode when the lookup %s, without asking again", async (_, lookup) => {
    const modeOf = jest.fn(lookup);
    const modes = memoizeModes(modeOf);

    await expect(modes("bitcoin")).resolves.toBe(DEFAULT_PORTFOLIO_MODE);
    await expect(modes("bitcoin")).resolves.toBe(DEFAULT_PORTFOLIO_MODE);
    expect(modeOf).toHaveBeenCalledTimes(1);
  });
});

describe("resolveMode", () => {
  it.each(PORTFOLIO_MODES)("answers the known mode %s", async mode => {
    await expect(resolveMode(() => mode, "bitcoin")).resolves.toBe(mode);
  });

  it("gives the default mode for an unknown one", async () => {
    await expect(resolveMode(async () => "" as PortfolioMode, "bitcoin")).resolves.toBe(
      DEFAULT_PORTFOLIO_MODE,
    );
  });
});
