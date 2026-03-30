import { getStateFromPath } from "@react-navigation/native";
import { landingPageHandler } from "../../handlers/landingPage";
import { validateLargeMoverLedgerIds, validateLargeMoverCurrencyIds } from "../../validation";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

jest.mock("../../validation", () => ({
  validateLargeMoverLedgerIds: jest.fn(),
  validateLargeMoverCurrencyIds: jest.fn(),
}));

function makeParsed(params: Record<string, string> = {}): ParsedDeeplink {
  const search = new URLSearchParams(params).toString();
  const fullPath = search ? `landing-page-large-mover?${search}` : "landing-page-large-mover";
  const url = new URL(`ledgerwallet://${fullPath}`);
  return {
    hostname: "landing-page-large-mover",
    pathname: "",
    platform: "",
    searchParams: url.searchParams,
    query: Object.fromEntries(url.searchParams),
    rawPath: fullPath,
    url,
  };
}

describe("landingPageHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);
  const mockedValidateLedgerIds = jest.mocked(validateLargeMoverLedgerIds);
  const mockedValidateCurrencyIds = jest.mocked(validateLargeMoverCurrencyIds);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
    mockedValidateLedgerIds.mockClear();
    mockedValidateCurrencyIds.mockClear();
  });

  describe("valid ledgerIds", () => {
    it("sets ledgerIds on the URL and calls getStateFromPath", () => {
      mockedValidateLedgerIds.mockReturnValue("bitcoin,ethereum");
      mockedValidateCurrencyIds.mockReturnValue(null);

      landingPageHandler(makeParsed({ ledgerIds: "bitcoin,ethereum" }), makeContext());

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("ledgerIds=bitcoin%2Cethereum");
      expect(path).not.toContain("market");
    });

    it("clears currencyIds when ledgerIds is valid", () => {
      mockedValidateLedgerIds.mockReturnValue("bitcoin");
      mockedValidateCurrencyIds.mockReturnValue(null);

      landingPageHandler(makeParsed({ ledgerIds: "bitcoin", currencyIds: "ETH" }), makeContext());

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("currencyIds=");
      expect(path).toContain("ledgerIds=bitcoin");
    });
  });

  describe("valid currencyIds (no ledgerIds)", () => {
    it("sets currencyIds on the URL and calls getStateFromPath", () => {
      mockedValidateLedgerIds.mockReturnValue(null);
      mockedValidateCurrencyIds.mockReturnValue("BTC");

      landingPageHandler(makeParsed({ currencyIds: "BTC" }), makeContext());

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("currencyIds=BTC");
      expect(path).not.toContain("market");
    });

    it("removes ledgerIds param when only currencyIds is valid", () => {
      mockedValidateLedgerIds.mockReturnValue(null);
      mockedValidateCurrencyIds.mockReturnValue("ETH");

      landingPageHandler(makeParsed({ ledgerIds: "invalid", currencyIds: "ETH" }), makeContext());

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).not.toContain("ledgerIds");
    });
  });

  describe("neither valid", () => {
    it("redirects to market", () => {
      mockedValidateLedgerIds.mockReturnValue(null);
      mockedValidateCurrencyIds.mockReturnValue(null);

      landingPageHandler(makeParsed(), makeContext());

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("market", undefined);
    });
  });
});
