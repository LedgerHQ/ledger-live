/**
 * @jest-environment jsdom
 */

import { t } from "i18next";
import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, fireEvent } from "tests/testUtils";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";
import { LNSBannerCard } from "../components/LNSBannerCard";
import { useLNSUpsellBannerModel } from "../hooks/useLNSUpsellBannerModel";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

describe("LNSBannerCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    { location: "accounts", page: "Accounts" },
    { location: "manager", page: "Manager" },
    { location: "portfolio", page: "Portfolio" },
  ] as const)("on the $page page", ({ location, page }) => {
    it("should not render if the feature flag is disabled", () => {
      renderBanner({ ffEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.banner.${location}.optIn.cta`))).toBeNull();
    });

    it("should not render if the location param is disabled on the feature flag", () => {
      renderBanner({ ffLocationEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.banner.${location}.optIn.cta`))).toBeNull();
    });

    it("should not render if the user uses another device", () => {
      renderBanner({ devicesModelList: [DeviceModelId.nanoSP] });
      expect(screen.queryByText(t(`lnsUpsell.banner.${location}.optIn.cta`))).toBeNull();
    });

    it("should not render if the user has no devices", () => {
      renderBanner({ devicesModelList: [] });
      expect(screen.queryByText(t(`lnsUpsell.banner.${location}.optIn.cta`))).toBeNull();
    });

    it("should track click on the cta", () => {
      renderBanner({});
      fireEvent.click(screen.getByText(t(`lnsUpsell.banner.${location}.optIn.cta`)));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith("https://example.com/optInCta");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optInCta",
        page,
      });
    });

    it("should track click on learn more", () => {
      renderBanner({});
      fireEvent.click(screen.getByText(t(`lnsUpsell.banner.${location}.optIn.linkText`)));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith("https://example.com/learn-more");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "learn more",
        link: "https://example.com/learn-more",
        page,
      });
    });

    it("should render the banner for opted out users", () => {
      renderBanner({ isOptIn: false });
      fireEvent.click(screen.getByText(t(`lnsUpsell.banner.${location}.optOut.cta`)));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith("https://example.com/optOutCta");
      // NOTE track will be called but this function has it's own logic not to track opt out users
    });

    function renderBanner({
      ffEnabled = true,
      ffLocationEnabled = true,
      isOptIn = true,
      devicesModelList = [DeviceModelId.nanoS],
    }) {
      const learn_more = "https://example.com/learn-more";
      const defaultParams = { [location]: ffLocationEnabled, learn_more, "%": 10, img: "" };
      const ffParams = {
        opted_in: { ...defaultParams, link: "https://example.com/optInCta" },
        opted_out: { ...defaultParams, link: "https://example.com/optOutCta" },
      };

      render(<Banner />, {
        initialState: {
          settings: {
            shareAnalytics: true,
            sharePersonalizedRecommandations: isOptIn,
            devicesModelList,
            overriddenFeatureFlags: {
              lldNanoSUpsellBanners: { enabled: ffEnabled, params: ffParams },
            },
          },
        },
      });
    }

    function Banner() {
      return <LNSBannerCard model={useLNSUpsellBannerModel(location)} />;
    }
  });
});
