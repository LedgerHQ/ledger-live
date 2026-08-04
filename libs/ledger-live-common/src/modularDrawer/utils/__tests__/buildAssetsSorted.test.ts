import {
  mockAssetsData,
  mockBitcoinAssetsData,
  mockUsdcAssetsData,
} from "../../../dada-client/__mocks__/assets.mock";
import { buildAssetsSorted } from "../buildAssetsSorted";

describe("buildAssetsSorted", () => {
  it("filters native assets and tokens by their parent network", () => {
    const ethereumTokens = buildAssetsSorted(mockAssetsData, {
      includeMetaCurrencyId: true,
      networkIds: ["ethereum"],
    });
    const usdc = buildAssetsSorted(mockUsdcAssetsData, {
      includeMetaCurrencyId: true,
      networkIds: ["ethereum"],
    });
    const bitcoin = buildAssetsSorted(mockBitcoinAssetsData, {
      includeMetaCurrencyId: true,
      networkIds: ["bitcoin"],
    });

    expect(ethereumTokens[0]?.asset).toMatchObject({
      metaCurrencyId: "urn:crypto:meta-currency:injective_protocol",
      assetsIds: { ethereum: "ethereum/erc20/injective_token" },
    });
    expect(ethereumTokens[0]?.networks).toEqual([
      expect.objectContaining({ id: "ethereum/erc20/injective_token" }),
    ]);
    expect(usdc[0]?.asset.assetsIds).toEqual({
      ethereum: "ethereum/erc20/usd_coin",
    });
    expect(bitcoin[0]?.networks).toEqual([expect.objectContaining({ id: "bitcoin" })]);
  });

  it("omits meta-currency identifiers by default", () => {
    const assets = buildAssetsSorted(mockAssetsData, {
      networkIds: ["ethereum"],
    });

    expect(assets.every(({ asset }) => asset.metaCurrencyId === undefined)).toBe(true);
  });

  it("preserves all asset networks without a network filter", () => {
    const [injective] = buildAssetsSorted(mockAssetsData, {
      includeMetaCurrencyId: true,
    });

    expect(injective?.asset.assetsIds).toEqual(
      mockAssetsData.cryptoAssets["urn:crypto:meta-currency:injective_protocol"].assetsIds,
    );
    expect(injective?.networks).toHaveLength(3);
  });
});
