import { getStateFromPath } from "@react-navigation/native";
import { assetHandler } from "../../handlers/asset";
import { validateMarketCurrencyId } from "../../validation";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

jest.mock("../../validation", () => ({
  validateMarketCurrencyId: jest.fn(),
}));

function makeParsed(currencyId = ""): ParsedDeeplink {
  const pathname = currencyId ? `/${currencyId}` : "";
  const url = new URL(`ledgerwallet://asset${pathname}`);
  return {
    hostname: "asset",
    pathname,
    platform: currencyId,
    searchParams: url.searchParams,
    query: {},
    rawPath: `asset${pathname}`,
    url,
  };
}

describe("assetHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);
  const mockedValidate = jest.mocked(validateMarketCurrencyId);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
    mockedValidate.mockClear();
  });

  describe("with a currencyId in the path", () => {
    it("redirects to portfolio when currencyId is invalid", () => {
      mockedValidate.mockReturnValue(null);

      assetHandler(makeParsed("not-a-currency"), makeContext());

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("portfolio", undefined);
    });

    it("navigates with the validated currencyId when valid", () => {
      mockedValidate.mockReturnValue("bitcoin");

      assetHandler(makeParsed("bitcoin"), makeContext());

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("bitcoin");
      expect(path).not.toContain("portfolio");
    });

    it("uses the normalised id returned by validation, not the raw input", () => {
      mockedValidate.mockReturnValue("ethereum");

      const parsed = makeParsed("ETHEREUM");
      assetHandler(parsed, makeContext());

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("ethereum");
    });
  });

  describe("without a currencyId in the path", () => {
    it("redirects to portfolio", () => {
      assetHandler(makeParsed(), makeContext());

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("portfolio", undefined);
    });

    it("does not call validateMarketCurrencyId", () => {
      assetHandler(makeParsed(), makeContext());

      expect(mockedValidate).not.toHaveBeenCalled();
    });
  });
});
