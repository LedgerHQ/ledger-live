import React from "react";
import { render, screen } from "@testing-library/react-native";
import { SettingsPortProvider } from "@features/flow-settings";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { createFakeSettingsAboutPort } from "./__tests__/fakeSettingsAboutPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { SettingsAbout } from "./SettingsAbout";

jest.mock("@shared/analytics-react", () => ({ TrackScreen: () => null }));

const { LinkingWrapper } = createFakeLinking();

describe("SettingsAbout on mobile", () => {
  it("renders the legal and the social sections", () => {
    render(
      <I18nWrapper>
        <LinkingWrapper>
          <SettingsPortProvider value={createFakeSettingsAboutPort()}>
            <SettingsAbout testID="settings-about" />
          </SettingsPortProvider>
        </LinkingWrapper>
      </I18nWrapper>,
    );

    expect(screen.getByTestId("settings-about-legal")).toBeTruthy();
    expect(screen.getByTestId("settings-about-social")).toBeTruthy();
  });
});
