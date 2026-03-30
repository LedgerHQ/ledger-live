import { getStateFromPath } from "@react-navigation/native";
import { marketHandler } from "../../handlers/market";
import { validateMarketCurrencyId } from "../../validation";
import { handleMarketBannerDeeplink } from "../../handleMarketBannerDeeplink";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

jest.mock("../../validation", () => ({
  validateMarketCurrencyId: jest.fn(),
}));

jest.mock("../../handleMarketBannerDeeplink", () => ({
  handleMarketBannerDeeplink: jest.fn(() => ({ routes: [{ name: "market-banner" }] })),
}));

function makeParsed(currencyId = ""): ParsedDeeplink {
  const pathname = currencyId ? `/${currencyId}` : "";
  const url = new URL(`ledgerwallet://market${pathname}`);
  return {
    hostname: "market",
    pathname,
    platform: currencyId,
    searchParams: url.searchParams,
    query: {},
    rawPath: `market${pathname}`,
    url,
  };
}

describe("marketHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);
  const mockedValidate = jest.mocked(validateMarketCurrencyId);
  const mockedBannerDeeplink = jest.mocked(handleMarketBannerDeeplink);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
    mockedValidate.mockClear();
    mockedBannerDeeplink.mockClear();
  });

  describe("with a currencyId in the path", () => {
    it("redirects to market list when currencyId fails validation", () => {
      mockedValidate.mockReturnValue(null);

      marketHandler(makeParsed("not-a-currency"), makeContext());

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("market", undefined);
    });

    it("navigates to the market detail page with the validated currencyId", () => {
      mockedValidate.mockReturnValue("bitcoin");

      marketHandler(makeParsed("bitcoin"), makeContext());

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("bitcoin");
      expect(path).not.toContain("market\n");
    });

    it("uses the normalised id returned by validation, not the raw input", () => {
      mockedValidate.mockReturnValue("ethereum");

      marketHandler(makeParsed("ETHEREUM"), makeContext());

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("ethereum");
    });

    it("does not call handleMarketBannerDeeplink even when banner is enabled", () => {
      mockedValidate.mockReturnValue("bitcoin");

      marketHandler(makeParsed("bitcoin"), makeContext({ shouldDisplayMarketBanner: true }));

      expect(mockedBannerDeeplink).not.toHaveBeenCalled();
    });
  });

  describe("without a currencyId in the path", () => {
    it("returns the market banner state when shouldDisplayMarketBanner is true", () => {
      const result = marketHandler(makeParsed(), makeContext({ shouldDisplayMarketBanner: true }));

      expect(mockedBannerDeeplink).toHaveBeenCalled();
      expect(result).toEqual({ routes: [{ name: "market-banner" }] });
    });

    it("falls through to getStateFromPath('market') when banner is disabled", () => {
      marketHandler(makeParsed(), makeContext({ shouldDisplayMarketBanner: false }));

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("market", undefined);
      expect(mockedBannerDeeplink).not.toHaveBeenCalled();
    });

    it("does not call validateMarketCurrencyId", () => {
      marketHandler(makeParsed(), makeContext());

      expect(mockedValidate).not.toHaveBeenCalled();
    });
  });
});
