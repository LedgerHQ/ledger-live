import React, { type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { useFeature } from "@features/platform-feature-flags";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import type { SettingsSectionId } from "../../logic/settingsSections";
import { SettingsGate } from "./SettingsGate";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));

const mockUseFeature = jest.mocked(useFeature);

const renderGate = (subPath: string, renderSection?: (section: SettingsSectionId) => ReactNode) =>
  render(
    <SettingsGate
      subPath={subPath}
      onSelectSection={jest.fn()}
      legacySettings={<span>Legacy settings</span>}
      rowsToHide={[]}
      renderSection={renderSection}
      testID="settings-page"
    />,
    { wrapper: I18nWrapper },
  );

describe("SettingsGate", () => {
  it("shows the new Settings page when the flag is on", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    renderGate("");

    expect(screen.getByTestId("settings-page")).toBeVisible();
    expect(screen.queryByText("Legacy settings")).not.toBeInTheDocument();
  });

  it("shows the legacy Settings when the flag is off", () => {
    mockUseFeature.mockReturnValue({ enabled: false });

    renderGate("");

    expect(screen.getByText("Legacy settings")).toBeVisible();
    expect(screen.queryByTestId("settings-page")).not.toBeInTheDocument();
  });

  it("shows the legacy Settings for a section the new ones do not cover yet", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    renderGate("developer");

    expect(screen.getByText("Legacy settings")).toBeVisible();
  });

  it("shows the content the app gives for the selected section", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    renderGate("security", section => <span>Content of {section}</span>);

    expect(screen.getByText("Content of security")).toBeVisible();
  });
});
