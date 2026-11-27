import React from "react";
import { render, screen } from "@testing-library/react-native";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { createFakeSettingsAboutPort } from "./__tests__/fakeSettingsAboutPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { SettingsAbout } from "./SettingsAbout";

const { LinkingWrapper } = createFakeLinking();

describe("SettingsAbout on mobile", () => {
  it("renders the legal and the social sections", () => {
    render(
      <I18nWrapper>
        <LinkingWrapper>
          <SettingsAbout port={createFakeSettingsAboutPort()} testID="settings-about" />
        </LinkingWrapper>
      </I18nWrapper>,
    );

    expect(screen.getByTestId("settings-about-legal")).toBeTruthy();
    expect(screen.getByTestId("settings-about-social")).toBeTruthy();
  });
});
