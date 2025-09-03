/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useModularDrawerVisibility } from "../useModularDrawerVisibility";
import { ModularDrawerLocation } from "../enums";
import {
  makeMockedFeatureFlagsProviderWrapper,
  makeMockedContextValue,
} from "../../featureFlags/mock";

describe("useModularDrawerVisibility", () => {
  describe("lldModularDrawer", () => {
    it("should return false if the feature flag is not enabled", () => {
      const mockedFeatures = {
        lldModularDrawer: {
          enabled: false,
          params: { [ModularDrawerLocation.ADD_ACCOUNT]: true },
        },
      };

      const { result } = renderHook(
        () =>
          useModularDrawerVisibility({
            modularDrawerFeatureFlagKey: "lldModularDrawer",
          }),
        {
          wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
        },
      );

      expect(
        result.current.isModularDrawerVisible({ location: ModularDrawerLocation.ADD_ACCOUNT }),
      ).toBe(false);
    });

    it("should return false if the location param is not set", () => {
      const mockedFeatures = {
        lldModularDrawer: { enabled: true, params: {} },
      };

      const { result } = renderHook(
        () =>
          useModularDrawerVisibility({
            modularDrawerFeatureFlagKey: "lldModularDrawer",
          }),
        {
          wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
        },
      );

      expect(
        result.current.isModularDrawerVisible({ location: ModularDrawerLocation.ADD_ACCOUNT }),
      ).toBe(false);
    });

    it("should return the correct visibility for each location", () => {
      const mockedFeatures = {
        lldModularDrawer: {
          enabled: true,
          params: {
            [ModularDrawerLocation.ADD_ACCOUNT]: true,
          },
        },
      };

      const { result } = renderHook(
        () =>
          useModularDrawerVisibility({
            modularDrawerFeatureFlagKey: "lldModularDrawer",
          }),
        {
          wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
        },
      );

      expect(
        result.current.isModularDrawerVisible({ location: ModularDrawerLocation.ADD_ACCOUNT }),
      ).toBe(true);
      expect(
        result.current.isModularDrawerVisible({
          location: ModularDrawerLocation.LIVE_APP,
          liveAppId: "earn",
        }),
      ).toBe(false);
    });
  });

  describe("llmModularDrawer", () => {
    it("should return false if the feature flag is not enabled", () => {
      const mockedFeatures = {
        llmModularDrawer: {
          enabled: false,
          params: { [ModularDrawerLocation.ADD_ACCOUNT]: true },
        },
      };

      const { result } = renderHook(
        () =>
          useModularDrawerVisibility({
            modularDrawerFeatureFlagKey: "llmModularDrawer",
          }),
        {
          wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
        },
      );

      expect(
        result.current.isModularDrawerVisible({ location: ModularDrawerLocation.ADD_ACCOUNT }),
      ).toBe(false);
    });

    it("should return false if the location param is not set", () => {
      const mockedFeatures = {
        llmModularDrawer: { enabled: true, params: {} },
      };

      const { result } = renderHook(
        () =>
          useModularDrawerVisibility({
            modularDrawerFeatureFlagKey: "llmModularDrawer",
          }),
        {
          wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
        },
      );

      expect(
        result.current.isModularDrawerVisible({ location: ModularDrawerLocation.ADD_ACCOUNT }),
      ).toBe(false);
    });

    it("should return the correct visibility for each location", () => {
      const mockedFeatures = {
        llmModularDrawer: {
          enabled: true,
          params: {
            [ModularDrawerLocation.ADD_ACCOUNT]: false,
            [ModularDrawerLocation.RECEIVE_FLOW]: true,
          },
        },
      };

      const { result } = renderHook(
        () =>
          useModularDrawerVisibility({
            modularDrawerFeatureFlagKey: "llmModularDrawer",
          }),
        {
          wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
        },
      );

      expect(
        result.current.isModularDrawerVisible({ location: ModularDrawerLocation.ADD_ACCOUNT }),
      ).toBe(false);
      expect(
        result.current.isModularDrawerVisible({ location: ModularDrawerLocation.RECEIVE_FLOW }),
      ).toBe(true);
      expect(
        result.current.isModularDrawerVisible({
          location: ModularDrawerLocation.LIVE_APP,
          liveAppId: "earn",
        }),
      ).toBe(false);
      expect(
        result.current.isModularDrawerVisible({ location: ModularDrawerLocation.SEND_FLOW }),
      ).toBe(false);
    });
  });

  describe("Live app whitelist and blacklist logic", () => {
    describe("lldModularDrawer", () => {
      it("should return false if live_app location is not enabled", () => {
        const mockedFeatures = {
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: false,
              live_apps_allowlist: ["earn"],
              live_apps_blocklist: [],
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "lldModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "earn",
          }),
        ).toBe(false);
      });

      it("should return true for whitelisted apps when whitelist is provided", () => {
        const mockedFeatures = {
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
              live_apps_allowlist: ["earn", "swap"],
              live_apps_blocklist: [],
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "lldModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "earn",
          }),
        ).toBe(true);

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "swap",
          }),
        ).toBe(true);
      });

      it("should return false for non-whitelisted apps when whitelist is provided", () => {
        const mockedFeatures = {
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
              live_apps_allowlist: ["earn"],
              live_apps_blocklist: [],
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "lldModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "swap",
          }),
        ).toBe(false);

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "unknown-app",
          }),
        ).toBe(false);
      });

      it("should return false for blacklisted apps", () => {
        const mockedFeatures = {
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
              live_apps_allowlist: [],
              live_apps_blocklist: ["blocked-app", "another-blocked-app"],
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "lldModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "blocked-app",
          }),
        ).toBe(false);

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "another-blocked-app",
          }),
        ).toBe(false);
      });

      it("should return true for non-blacklisted apps when no whitelist is provided", () => {
        const mockedFeatures = {
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
              live_apps_allowlist: [],
              live_apps_blocklist: ["blocked-app"],
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "lldModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "allowed-app",
          }),
        ).toBe(true);

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "earn",
          }),
        ).toBe(true);
      });

      it("should prioritize blacklist over whitelist", () => {
        const mockedFeatures = {
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
              live_apps_allowlist: ["earn", "swap"],
              live_apps_blocklist: ["swap"],
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "lldModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "earn",
          }),
        ).toBe(true);

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "swap",
          }),
        ).toBe(false);
      });

      it("should handle missing whitelist and blacklist arrays", () => {
        const mockedFeatures = {
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "lldModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "any-app",
          }),
        ).toBe(true);
      });
    });

    describe("llmModularDrawer", () => {
      it("should return true for whitelisted apps", () => {
        const mockedFeatures = {
          llmModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
              live_apps_allowlist: ["earn", "swap"],
              live_apps_blocklist: [],
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "llmModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "earn",
          }),
        ).toBe(true);
      });

      it("should return false for blacklisted apps even if whitelisted", () => {
        const mockedFeatures = {
          llmModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
              live_apps_allowlist: ["earn", "swap"],
              live_apps_blocklist: ["swap"],
            },
          },
        };

        const { result } = renderHook(
          () =>
            useModularDrawerVisibility({
              modularDrawerFeatureFlagKey: "llmModularDrawer",
            }),
          {
            wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
          },
        );

        expect(
          result.current.isModularDrawerVisible({
            location: ModularDrawerLocation.LIVE_APP,
            liveAppId: "swap",
          }),
        ).toBe(false);
      });
    });
  });
});
