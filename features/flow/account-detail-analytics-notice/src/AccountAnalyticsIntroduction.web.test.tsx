import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AccountAnalyticsIntroduction } from "./AccountAnalyticsIntroduction";

describe("AccountAnalyticsIntroduction", () => {
  it("should show the introduction without consuming it when the account is eligible", () => {
    const onDismiss = jest.fn();
    render(
      <AccountAnalyticsIntroduction
        hasConfirmedHistory
        hasDismissed={false}
        onDismiss={onDismiss}
        onOpenAnalytics={jest.fn()}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByText("accountDetail.analyticsIntroduction.title")).toBeVisible();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it.each([
    { hasConfirmedHistory: false, hasDismissed: false },
    { hasConfirmedHistory: true, hasDismissed: true },
  ])("should hide the introduction when ineligible with %o", status => {
    render(
      <AccountAnalyticsIntroduction
        {...status}
        onDismiss={jest.fn()}
        onOpenAnalytics={jest.fn()}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should consume the introduction before opening Analytics when the CTA is activated", () => {
    const onDismiss = jest.fn();
    const onOpenAnalytics = jest.fn(() => expect(onDismiss).toHaveBeenCalledTimes(1));
    render(
      <AccountAnalyticsIntroduction
        hasConfirmedHistory
        hasDismissed={false}
        onDismiss={onDismiss}
        onOpenAnalytics={onOpenAnalytics}
      />,
      { wrapper: I18nTestProvider },
    );

    fireEvent.click(
      screen.getByRole("button", { name: "accountDetail.analyticsIntroduction.cta" }),
    );

    expect(onOpenAnalytics).toHaveBeenCalledTimes(1);
  });
});
