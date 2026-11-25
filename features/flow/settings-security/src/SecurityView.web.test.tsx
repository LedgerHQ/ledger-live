import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPortProvider } from "@features/flow-settings";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { createFakeSecurityPort } from "./__tests__/fakeSecurityPort";
import { Security } from "./Security";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ Track: () => null }));

function renderSecurity(initial?: Parameters<typeof createFakeSecurityPort>[0]) {
  const fake = createFakeSecurityPort(initial);
  render(
    <I18nWrapper>
      <SettingsPortProvider value={fake.port}>
        <Security testID="settings-security" />
      </SettingsPortProvider>
    </I18nWrapper>,
  );
  return fake;
}

describe("Security", () => {
  it("shows hide balance, App lock and MEV protection with their descriptions", () => {
    renderSecurity();

    expect(screen.getByText("Hide balance")).toBeVisible();
    expect(screen.getByText("Set a password to open the app.")).toBeVisible();
    expect(screen.getByText("MEV protection")).toBeVisible();
    expect(screen.queryByText("Auto-lock")).not.toBeInTheDocument();
  });

  it("shows Auto-lock and Change password when a password is set", () => {
    renderSecurity({ passwordSet: true });

    expect(screen.getByText("Auto-lock")).toBeVisible();
    expect(screen.getByRole("button", { name: "Change" })).toBeVisible();
  });

  it("shows a toggle for hide balance, App lock and MEV protection", () => {
    renderSecurity();

    expect(screen.getByTestId("setting-hideBalance-toggle")).toHaveAttribute(
      "aria-label",
      "Hide balance",
    );
    expect(screen.getByTestId("setting-appLock-toggle")).toHaveAttribute("aria-label", "App lock");
    expect(screen.getByTestId("setting-mevProtection-toggle")).toHaveAttribute(
      "aria-label",
      "MEV protection",
    );
  });

  it("asks the app to change the password from the Change button", async () => {
    const user = userEvent.setup();
    const { requestAppLock } = renderSecurity({ passwordSet: true });

    await user.click(screen.getByRole("button", { name: "Change" }));

    expect(requestAppLock.mock.calls).toEqual([["change"]]);
  });

  it("opens the MEV protection page from Learn more", async () => {
    const user = userEvent.setup();
    const { openMevProtectionInfo } = renderSecurity();

    await user.click(screen.getByRole("button", { name: "Learn more" }));

    expect(openMevProtectionInfo).toHaveBeenCalledTimes(1);
  });
});
