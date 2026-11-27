import { renderHook } from "@testing-library/react";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { useSettingsPageViewModel } from "./useSettingsPageViewModel";

describe("useSettingsPageViewModel", () => {
  it("lists the five sections with their labels", () => {
    const { result } = renderHook(
      () => useSettingsPageViewModel({ selectedSection: "privacy", onSelectSection: jest.fn() }),
      { wrapper: I18nWrapper },
    );

    expect(result.current.title).toBe("Settings");
    expect(result.current.selectedSection).toBe("privacy");
    expect(result.current.tabs).toEqual([
      { id: "general", label: "General" },
      { id: "assetManagement", label: "Asset management" },
      { id: "security", label: "Security" },
      { id: "privacy", label: "Privacy" },
      { id: "about", label: "About" },
    ]);
  });

  it("opens the selected tab, and General for an unknown one", () => {
    const onSelectSection = jest.fn();
    const { result } = renderHook(
      () => useSettingsPageViewModel({ selectedSection: "general", onSelectSection }),
      { wrapper: I18nWrapper },
    );

    result.current.onSelectTab("security");
    result.current.onSelectTab("developer");

    expect(onSelectSection.mock.calls).toEqual([["security"], ["general"]]);
  });
});
