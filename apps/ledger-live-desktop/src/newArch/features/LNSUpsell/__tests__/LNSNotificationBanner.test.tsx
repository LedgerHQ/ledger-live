/**
 * @jest-environment jsdom
 */

import { t } from "i18next";
import React from "react";
import { render, screen, fireEvent } from "tests/testUtils";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";
import { LNSNotificationBanner } from "../components/LNSNotificationBanner";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

describe("LNSNotificationBanner", () => {
  it("should track click on the cta", () => {
    render(<LNSNotificationBanner type="optIn" ctaLink="https://example.com" discount={10} />);
    fireEvent.click(screen.getByText(t("lnsUpsell.banner.notifications.optIn.cta")));

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith("https://example.com");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Level up wallet",
      link: "https://example.com",
      page: "Notification Panel",
    });
  });
});
