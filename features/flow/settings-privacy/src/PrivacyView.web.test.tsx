import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPortProvider } from "@features/flow-settings";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { createFakePrivacyPort } from "./__tests__/fakePrivacyPort";
import { Privacy } from "./Privacy";
import { PRIVACY_URLS } from "./urls";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ Track: () => null }));

function renderPrivacy(initial?: Parameters<typeof createFakePrivacyPort>[0]) {
  const fake = createFakePrivacyPort(initial);
  const { openExternal, LinkingWrapper } = createFakeLinking();
  render(
    <I18nWrapper>
      <LinkingWrapper>
        <SettingsPortProvider value={fake.port}>
          <Privacy testID="settings-privacy" />
        </SettingsPortProvider>
      </LinkingWrapper>
    </I18nWrapper>,
  );
  return { ...fake, openExternal, user: userEvent.setup() };
}

describe("Privacy", () => {
  it("shows bug reports, app performance, personalized experience and the privacy policy", () => {
    renderPrivacy();

    expect(screen.getByTestId("settings-privacy")).toBeVisible();
    expect(screen.getByText("Bug reports")).toBeVisible();
    expect(
      screen.getByText("Enable Ledger to collect app usage to enhance the experience"),
    ).toBeVisible();
    expect(screen.getByText("Personalized experience")).toBeVisible();
    expect(screen.getByText("Privacy policy")).toBeVisible();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
  });

  it("shows one Analytics toggle when the consents are not separate", () => {
    renderPrivacy({ separateAnalyticsConsents: false });

    expect(screen.getByTestId("setting-analytics-toggle")).toHaveAttribute(
      "aria-label",
      "Analytics",
    );
    expect(screen.queryByText("App performance")).not.toBeInTheDocument();
    expect(screen.queryByText("Personalized experience")).not.toBeInTheDocument();
  });

  it("shows a toggle named after each consent", () => {
    renderPrivacy();

    expect(screen.getByTestId("setting-bugReports-toggle")).toHaveAttribute(
      "aria-label",
      "Bug reports",
    );
    expect(screen.getByTestId("setting-appPerformance-toggle")).toHaveAttribute(
      "aria-label",
      "App performance",
    );
    expect(screen.getByTestId("setting-personalizedExperience-toggle")).toHaveAttribute(
      "aria-label",
      "Personalized experience",
    );
  });

  it("opens the privacy policy from its row", async () => {
    const { user, openExternal } = renderPrivacy();

    await user.click(screen.getByText("Privacy policy"));

    expect(openExternal.mock.calls).toEqual([[PRIVACY_URLS.privacyPolicy.desktop]]);
  });
});
