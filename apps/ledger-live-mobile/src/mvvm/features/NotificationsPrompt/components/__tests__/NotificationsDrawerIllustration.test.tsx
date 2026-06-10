import React from "react";
import { render } from "@tests/test-renderer";
import NotificationsBellDark from "~/images/illustration/Dark/_NotificationsBell.webp";
import NotificationsBellLight from "~/images/illustration/Light/_NotificationsBell.webp";
import NotificationsPerformanceChartDark from "~/images/illustration/Dark/_NotificationsPerformanceChart.webp";
import NotificationsPerformanceChartLight from "~/images/illustration/Light/_NotificationsPerformanceChart.webp";
import {
  NotificationsDrawerIllustration,
  resolveNotificationsDrawerIllustrationSources,
} from "../NotificationsDrawerIllustration";

jest.mock("~/images/illustration/Illustration", () => "Illustration");

describe("resolveNotificationsDrawerIllustrationSources", () => {
  it("should return performance chart assets for global push", () => {
    expect(resolveNotificationsDrawerIllustrationSources("globalPushNotifications")).toEqual({
      lightSource: NotificationsPerformanceChartLight,
      darkSource: NotificationsPerformanceChartDark,
    });
  });

  it("should return performance chart assets during onboarding", () => {
    expect(resolveNotificationsDrawerIllustrationSources()).toEqual({
      lightSource: NotificationsPerformanceChartLight,
      darkSource: NotificationsPerformanceChartDark,
    });
  });

  it("should return bell assets for transaction alerts", () => {
    expect(resolveNotificationsDrawerIllustrationSources("transactionsAlertsCategory")).toEqual({
      lightSource: NotificationsBellLight,
      darkSource: NotificationsBellDark,
    });
  });
});

describe("NotificationsDrawerIllustration", () => {
  it("should render without crashing", () => {
    render(<NotificationsDrawerIllustration promptTarget="globalPushNotifications" />);
  });
});
