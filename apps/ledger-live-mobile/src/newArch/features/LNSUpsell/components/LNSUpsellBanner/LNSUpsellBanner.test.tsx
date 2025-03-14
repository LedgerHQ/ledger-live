import merge from "lodash/merge";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, fireEvent, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { LNSUpsellBanner } from ".";

describe("LNSUpsellBanner ", () => {
  const { t } = renderHook(useTranslation).result.current;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    { location: "accounts", page: "Accounts" },
    { location: "manager", page: "Manager" },
    { location: "wallet", page: "Wallet" },
    { location: "notification_center", page: "NotificationPanel" },
  ] as const)("on the $page page", ({ location, page }) => {
    it("should not render if the feature flag is disabled", () => {
      renderBanner({ ffEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the location param is disabled on the feature flag", () => {
      renderBanner({ ffLocationEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the user uses another device", () => {
      renderBanner({ devicesModelList: [DeviceModelId.nanoSP] });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the user has no devices", () => {
      renderBanner({ devicesModelList: [] });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the user swapped currencies at least twice", () => {
      renderBanner({ swapHistory: [{}, {}] });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should track click on the cta", () => {
      renderBanner({});
      fireEvent.press(screen.getByText(t(`lnsUpsell.opted_in.cta`)));

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/optInCta");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optInCta",
        page,
      });
    });

    it("should render the banner for opted out users", () => {
      renderBanner({ isOptIn: false });
      fireEvent.press(screen.getByText(t(`lnsUpsell.opted_out.cta`)));

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/optOutCta");
      // NOTE track will be called but this function has it's own logic not to track opt out users
    });

    function renderBanner({
      ffEnabled = true,
      ffLocationEnabled = true,
      isOptIn = true,
      devicesModelList = [DeviceModelId.nanoS],
      swapHistory = [] as unknown[],
    }) {
      const defaultParams = { [location]: ffLocationEnabled, "%": 10, img: "" };
      const ffParams = {
        opted_in: { ...defaultParams, link: "https://example.com/optInCta" },
        opted_out: { ...defaultParams, link: "https://example.com/optOutCta" },
      };

      render(<LNSUpsellBanner location={location} />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              shareAnalytics: true,
              personalizedRecommendationsEnabled: isOptIn,
              knownDeviceModelIds: Object.fromEntries(devicesModelList.map(model => [model, true])),
              anonymousUserNotifications: {},
              overriddenFeatureFlags: {
                llmNanoSUpsellBanners: { enabled: ffEnabled, params: ffParams },
              },
            },
            accounts: { active: [{ swapHistory }] },
          }),
      });
    }
  });
});
