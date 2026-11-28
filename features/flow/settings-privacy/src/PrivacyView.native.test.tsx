import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { SettingsPortProvider } from "@features/flow-settings";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { createFakePrivacyPort } from "./__tests__/fakePrivacyPort";
import { Privacy } from "./Privacy";
import { PRIVACY_URLS } from "./urls";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ Track: () => null }));

function renderPrivacy() {
  const fake = createFakePrivacyPort();
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

describe("Privacy on mobile", () => {
  it("shows bug reports, app performance, personalized experience and the privacy policy", () => {
    renderPrivacy();

    expect(screen.getByText("Bug reports")).toBeVisible();
    expect(screen.getByText("App performance")).toBeVisible();
    expect(screen.getByText("Personalized experience")).toBeVisible();
    expect(screen.getByText("Privacy policy")).toBeVisible();
  });

  it("opens the mobile privacy policy", async () => {
    const { user, openExternal } = renderPrivacy();

    await user.press(screen.getByText("Privacy policy"));

    expect(openExternal.mock.calls).toEqual([[PRIVACY_URLS.privacyPolicy.mobile]]);
  });
});
