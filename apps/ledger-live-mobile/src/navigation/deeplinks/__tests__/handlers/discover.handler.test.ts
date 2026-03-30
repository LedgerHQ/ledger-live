import { getStateFromPath } from "@react-navigation/native";
import { discoverHandler } from "../../handlers/discover";
import { handleWallet40Deeplink } from "../../handleWallet40Deeplink";
import type { ParsedDeeplink, DeeplinkHandlerResult } from "../../types";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

jest.mock("../../handleWallet40Deeplink", () => ({
  handleWallet40Deeplink: jest.fn(
    (): DeeplinkHandlerResult => ({ routes: [{ name: "w40:discover" }] }),
  ),
}));

const MOCK_MANIFEST = { id: "paraswap", name: "ParaSwap" } as LiveAppManifest;

function makeParsed(hostname: "discover" | "recover", platform = ""): ParsedDeeplink {
  const pathname = platform ? `/${platform}` : "";
  const url = new URL(`ledgerwallet://${hostname}${pathname}`);
  return {
    hostname,
    pathname,
    platform,
    searchParams: url.searchParams,
    query: {},
    rawPath: `${hostname}${pathname}`,
    url,
  };
}

describe("discoverHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);
  const mockedW40 = jest.mocked(handleWallet40Deeplink);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
    mockedW40.mockClear();
  });

  describe("no platform (bare 'discover' or 'recover')", () => {
    it("delegates to handleWallet40Deeplink when w40 is enabled", () => {
      discoverHandler(
        makeParsed("discover"),
        makeContext({ shouldDisplayWallet40MainNav: true }),
      );

      expect(mockedW40).toHaveBeenCalledWith("discover", "", {});
    });

    it("returns w40 navigation state when w40 is enabled", () => {
      const result = discoverHandler(
        makeParsed("discover"),
        makeContext({ shouldDisplayWallet40MainNav: true }),
      );

      expect(result).toEqual({ routes: [{ name: "w40:discover" }] });
    });

    it("falls through to getStateFromPath with rawPath when w40 is disabled", () => {
      discoverHandler(makeParsed("discover"), makeContext({ shouldDisplayWallet40MainNav: false }));

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("discover", undefined);
    });
  });

  describe("with platform, onboarding incomplete", () => {
    it("returns undefined for a non-protect platform", () => {
      const result = discoverHandler(
        makeParsed("discover", "paraswap"),
        makeContext({ hasCompletedOnboarding: false }),
      );

      expect(result).toBeUndefined();
    });

    it("proceeds past the onboarding guard for a protect-prefixed platform", () => {
      // Unlike a non-protect platform (which returns undefined immediately),
      // a protect-prefixed platform passes the guard and continues to manifest lookup.
      // Providing a matching manifest ensures getStateFromPath is reached.
      const recoverManifest = { id: "protectdata", name: "Protect Data" } as LiveAppManifest;

      discoverHandler(
        makeParsed("discover", "protectdata"),
        makeContext({ hasCompletedOnboarding: false, manifests: [recoverManifest] }),
      );

      expect(mockedGetStateFromPath).toHaveBeenCalled();
    });
  });

  describe("with platform, onboarding complete", () => {
    it("falls through to getStateFromPath on cold start (provider not initialized)", () => {
      discoverHandler(
        makeParsed("discover", "paraswap"),
        makeContext({ liveAppProviderInitialized: false }),
      );

      expect(mockedGetStateFromPath).toHaveBeenCalledWith("discover/paraswap", undefined);
    });

    it("returns undefined when manifest is not found", () => {
      const result = discoverHandler(
        makeParsed("discover", "unknown-app"),
        makeContext({ manifests: [MOCK_MANIFEST] }),
      );

      expect(result).toBeUndefined();
    });

    it("adds 'name' param and navigates when manifest is found", () => {
      discoverHandler(makeParsed("discover", "paraswap"), makeContext({ manifests: [MOCK_MANIFEST] }));

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("paraswap");
      expect(path).toContain("name=ParaSwap");
    });

    it("performs a case-insensitive manifest lookup", () => {
      discoverHandler(makeParsed("discover", "PARASWAP"), makeContext({ manifests: [MOCK_MANIFEST] }));

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("name=ParaSwap");
    });

    it("works for 'recover' hostname with a matching manifest", () => {
      const recoverManifest = { id: "protectdata", name: "Protect Data" } as LiveAppManifest;

      discoverHandler(
        makeParsed("recover", "protectdata"),
        makeContext({ manifests: [recoverManifest] }),
      );

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("protectdata");
    });
  });
});
