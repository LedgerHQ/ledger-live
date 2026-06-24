import { resolveAssetDetailMode } from "../useAssetDetailViewModel";

describe("resolveAssetDetailMode", () => {
  it("is 'ready' as soon as a currency resolves, even while data is still loading", () => {
    expect(
      resolveAssetDetailMode({
        hasCurrency: true,
        isDistributionLoading: true,
        isMarketLoading: true,
      }),
    ).toBe("ready");
  });

  it("is 'loading' while the distribution is still resolving and no currency yet", () => {
    expect(
      resolveAssetDetailMode({
        hasCurrency: false,
        isDistributionLoading: true,
        isMarketLoading: false,
      }),
    ).toBe("loading");
  });

  it("is 'loading' while the market data is still resolving and no currency yet", () => {
    // Covers the slug/token deeplink window (e.g. "hedera-hashgraph") where the currency is
    // recovered asynchronously from DADA — the body must not mount until it resolves.
    expect(
      resolveAssetDetailMode({
        hasCurrency: false,
        isDistributionLoading: false,
        isMarketLoading: true,
      }),
    ).toBe("loading");
  });

  it("is 'not-found' once everything settled and nothing resolved (e.g. invalid deeplink term)", () => {
    expect(
      resolveAssetDetailMode({
        hasCurrency: false,
        isDistributionLoading: false,
        isMarketLoading: false,
      }),
    ).toBe("not-found");
  });
});
