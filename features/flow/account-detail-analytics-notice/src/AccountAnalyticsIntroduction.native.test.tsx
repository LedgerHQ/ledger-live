import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AccountAnalyticsIntroduction } from "./AccountAnalyticsIntroduction";

const TEST_ID = "account-analytics-introduction";

function renderIntroduction(
  overrides: Partial<React.ComponentProps<typeof AccountAnalyticsIntroduction>> = {},
) {
  const props = {
    hasConfirmedHistory: true,
    hasDismissed: false,
    onDismiss: jest.fn(),
    onOpenAnalytics: jest.fn(),
    testID: TEST_ID,
    ...overrides,
  };
  render(<AccountAnalyticsIntroduction {...props} />, { wrapper: I18nTestProvider });
  return props;
}

describe("AccountAnalyticsIntroduction (native)", () => {
  it("should show the introduction without consuming it when the account is eligible", () => {
    const { onDismiss } = renderIntroduction();

    expect(screen.getByTestId(TEST_ID)).toBeVisible();
    expect(screen.getByText("accountDetail.analyticsIntroduction.title")).toBeVisible();
    expect(screen.getByText("accountDetail.analyticsIntroduction.description")).toBeVisible();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it.each([
    { hasConfirmedHistory: false, hasDismissed: false },
    { hasConfirmedHistory: true, hasDismissed: true },
  ])("should hide the introduction when ineligible with %o", status => {
    renderIntroduction(status);

    expect(screen.queryByTestId(TEST_ID)).toBeNull();
  });

  it("should consume the introduction when it is closed", () => {
    const { onDismiss, onOpenAnalytics } = renderIntroduction();
    const banner = screen.getByTestId(TEST_ID);

    expect(banner.props.closeAriaLabel).toBe("accountDetail.analyticsIntroduction.dismiss");
    fireEvent(banner, "close");

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onOpenAnalytics).not.toHaveBeenCalled();
  });

  it("should consume the introduction before opening Analytics when the CTA is pressed", () => {
    const onDismiss = jest.fn();
    const onOpenAnalytics = jest.fn(() => expect(onDismiss).toHaveBeenCalledTimes(1));
    renderIntroduction({ onDismiss, onOpenAnalytics });

    fireEvent.press(screen.getByText("accountDetail.analyticsIntroduction.cta"));

    expect(onOpenAnalytics).toHaveBeenCalledTimes(1);
  });
});
