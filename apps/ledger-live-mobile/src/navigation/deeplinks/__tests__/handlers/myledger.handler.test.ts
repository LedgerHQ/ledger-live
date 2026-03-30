import { getStateFromPath } from "@react-navigation/native";
import { myledgerHandler } from "../../handlers/myledger";
import { handleWallet40Deeplink } from "../../handleWallet40Deeplink";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

jest.mock("../../handleWallet40Deeplink", () => ({
  handleWallet40Deeplink: jest.fn(() => ({ routes: [{ name: "w40:myledger" }] })),
}));

function makeParsed(query: Record<string, string> = {}): ParsedDeeplink {
  const search = new URLSearchParams(query).toString();
  const fullPath = search ? `myledger?${search}` : "myledger";
  const url = new URL(`ledgerwallet://${fullPath}`);
  return {
    hostname: "myledger",
    pathname: "",
    platform: "",
    searchParams: url.searchParams,
    query: Object.fromEntries(url.searchParams),
    rawPath: fullPath,
    url,
  };
}

describe("myledgerHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);
  const mockedW40 = jest.mocked(handleWallet40Deeplink);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
    mockedW40.mockClear();
  });

  describe("Wallet 4.0 (shouldDisplayWallet40MainNav = true)", () => {
    it("delegates to handleWallet40Deeplink", () => {
      myledgerHandler(makeParsed(), makeContext({ shouldDisplayWallet40MainNav: true }));

      expect(mockedW40).toHaveBeenCalledWith("myledger", "", expect.any(Object));
    });

    it("returns the w40 navigation state", () => {
      const result = myledgerHandler(
        makeParsed(),
        makeContext({ shouldDisplayWallet40MainNav: true }),
      );

      expect(result).toEqual({ routes: [{ name: "w40:myledger" }] });
    });

    it("does not call getStateFromPath", () => {
      myledgerHandler(makeParsed(), makeContext({ shouldDisplayWallet40MainNav: true }));

      expect(mockedGetStateFromPath).not.toHaveBeenCalled();
    });
  });

  describe("standard nav (shouldDisplayWallet40MainNav = false)", () => {
    it("falls through to getStateFromPath with rawPath", () => {
      myledgerHandler(makeParsed(), makeContext({ shouldDisplayWallet40MainNav: false }));

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("myledger", undefined);
    });

    it("does not call handleWallet40Deeplink", () => {
      myledgerHandler(makeParsed(), makeContext({ shouldDisplayWallet40MainNav: false }));

      expect(mockedW40).not.toHaveBeenCalled();
    });
  });
});
