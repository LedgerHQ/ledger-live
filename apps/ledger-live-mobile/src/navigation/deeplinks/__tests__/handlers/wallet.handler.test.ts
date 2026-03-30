import { getStateFromPath } from "@react-navigation/native";
import { walletHandler } from "../../handlers/wallet";
import { isValidInstallApp } from "LLM/features/DeeplinkInstallApp";
import { openDeeplinkInstallAppDrawer } from "~/actions/deeplinkInstallApp";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

jest.mock("LLM/features/DeeplinkInstallApp", () => ({
  isValidInstallApp: jest.fn(),
}));

jest.mock("~/actions/deeplinkInstallApp", () => ({
  openDeeplinkInstallAppDrawer: jest.fn((args: unknown) => ({
    type: "OPEN_DEEPLINK_INSTALL_APP_DRAWER",
    payload: args,
  })),
}));

function makeParsed(hostname: string, params: Record<string, string> = {}): ParsedDeeplink {
  const search = new URLSearchParams(params).toString();
  const fullPath = search ? `${hostname}?${search}` : hostname;
  const url = new URL(`ledgerwallet://${fullPath}`);
  return {
    hostname,
    pathname: "",
    platform: "",
    searchParams: url.searchParams,
    query: Object.fromEntries(url.searchParams),
    rawPath: fullPath,
    url,
  };
}

describe("walletHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);
  const mockedIsValidInstallApp = jest.mocked(isValidInstallApp);
  const mockedOpenDrawer = jest.mocked(openDeeplinkInstallAppDrawer);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
    mockedIsValidInstallApp.mockClear();
    mockedOpenDrawer.mockClear();
  });

  describe("with a valid installApp param", () => {
    it("dispatches openDeeplinkInstallAppDrawer with the app name", () => {
      mockedIsValidInstallApp.mockReturnValue(true);
      const context = makeContext();

      walletHandler(makeParsed("wallet", { installApp: "RecoveryKeyUpdater" }), context);

      expect(context.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ payload: { appToInstall: "RecoveryKeyUpdater" } }),
      );
    });

    it("navigates to portfolio after opening the drawer", () => {
      mockedIsValidInstallApp.mockReturnValue(true);

      walletHandler(makeParsed("portfolio", { installApp: "RecoveryKeyUpdater" }), makeContext());

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("portfolio", undefined);
    });
  });

  describe("with an invalid installApp param", () => {
    it("does not dispatch and falls through to rawPath", () => {
      mockedIsValidInstallApp.mockReturnValue(false);
      const context = makeContext();
      const parsed = makeParsed("wallet", { installApp: "malicious<script>" });

      walletHandler(parsed, context);

      expect(context.dispatch).not.toHaveBeenCalled();
      // rawPath preserves the full query string — the handler passes it through unchanged
      expect(mockedGetStateFromPath).toHaveBeenCalledWith(parsed.rawPath, undefined);
    });
  });

  describe("without an installApp param", () => {
    it("falls through to rawPath for the 'wallet' hostname", () => {
      walletHandler(makeParsed("wallet"), makeContext());

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("wallet", undefined);
    });

    it("falls through to rawPath for the 'portfolio' hostname", () => {
      walletHandler(makeParsed("portfolio"), makeContext());

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("portfolio", undefined);
    });
  });
});
