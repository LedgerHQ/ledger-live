import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AccountAnalyticsIntroduction } from "./AccountAnalyticsIntroduction";

function renderIntroduction(
  overrides: Partial<React.ComponentProps<typeof AccountAnalyticsIntroduction>> = {},
) {
  const props = {
    isEnabled: true,
    hasConfirmedHistory: true,
    hasDismissed: false,
    onDismiss: jest.fn(),
    onOpenAnalytics: jest.fn(),
    ...overrides,
  };
  render(<AccountAnalyticsIntroduction {...props} />, { wrapper: I18nTestProvider });
  return props;
}

describe("AccountAnalyticsIntroduction", () => {
  it("should show the introduction without consuming it when the account is eligible", () => {
    const { onDismiss } = renderIntroduction();

    expect(screen.getByText("accountDetail.analyticsIntroduction.title")).toBeVisible();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it.each([{ isEnabled: false }, { hasConfirmedHistory: false }, { hasDismissed: true }])(
    "should hide the introduction with %o",
    override => {
      renderIntroduction(override);

      expect(screen.queryByRole("button")).toBeNull();
    },
  );

  it("should open Analytics without consuming the introduction when the CTA is activated", () => {
    const { onDismiss, onOpenAnalytics } = renderIntroduction();

    fireEvent.click(
      screen.getByRole("button", { name: "accountDetail.analyticsIntroduction.cta" }),
    );

    expect(onOpenAnalytics).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
