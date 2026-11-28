import React from "react";
import { renderHook } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useBackupSelectionContentViewModel } from "./useBackupSelectionContentViewModel";

const backupCreatedAt = new Date(2026, 8, 12, 0, 30);

const renderInLocale = (language: string) =>
  renderHook(() => useBackupSelectionContentViewModel(backupCreatedAt), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <I18nTestProvider language={language}>{children}</I18nTestProvider>
    ),
  });

describe("useBackupSelectionContentViewModel", () => {
  it.each([
    ["en", { date: "September 12", time: "12:30AM" }],
    ["fr", { date: "12 septembre", time: "0:30" }],
  ])("formats the date of the last save in %s", (locale, expected) => {
    const { result } = renderInLocale(locale);

    expect(result.current.lastSave).toEqual(expected);
  });
});
