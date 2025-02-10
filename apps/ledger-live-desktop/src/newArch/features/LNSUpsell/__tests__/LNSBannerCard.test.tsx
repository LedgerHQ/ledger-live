/**
 * @jest-environment jsdom
 */

import { t } from "i18next";
import React from "react";
import { render, screen, fireEvent } from "tests/testUtils";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";
import { LNSBannerCard } from "../components/LNSbannerCard";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

describe("LNSBannerCard", () => {
  describe.each([
    { location: "accounts", page: "Accounts" },
    { location: "manager", page: "Manager" },
  ] as const)("$page LNSBannerCard", ({ location, page }) => {
    beforeEach(() => {
      jest.clearAllMocks();
      render(
        <LNSBannerCard
          type="optIn"
          location={location}
          image=""
          ctaLink="https://example.com/cta"
          learnMoreLink="https://example.com/learn-more"
          discount={10}
        />,
      );
    });

    it("should track click on the cta", () => {
      fireEvent.click(screen.getByText(t(`lnsUpsell.banner.${location}.optIn.cta`)));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith("https://example.com/cta");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/cta",
        page,
      });
    });

    it("should track click on learn more", () => {
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
  });
});
