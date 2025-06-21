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

      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(false);
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

      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(false);
    });

    it("should return the correct visibility for each location", () => {
      const mockedFeatures = {
        lldModularDrawer: {
          enabled: true,
          params: {
            [ModularDrawerLocation.ADD_ACCOUNT]: true,
            [ModularDrawerLocation.EARN_FLOW]: false,
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

      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(true);
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.EARN_FLOW)).toBe(false);
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.LIVE_APP)).toBe(false);
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

      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(false);
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

      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(false);
    });

    it("should return the correct visibility for each location", () => {
      const mockedFeatures = {
        llmModularDrawer: {
          enabled: true,
          params: {
            [ModularDrawerLocation.ADD_ACCOUNT]: false,
            [ModularDrawerLocation.EARN_FLOW]: true,
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

      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(false);
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.EARN_FLOW)).toBe(true);
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.RECEIVE_FLOW)).toBe(true);
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.LIVE_APP)).toBe(false);
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation.SEND_FLOW)).toBe(false);
    });
  });
});
