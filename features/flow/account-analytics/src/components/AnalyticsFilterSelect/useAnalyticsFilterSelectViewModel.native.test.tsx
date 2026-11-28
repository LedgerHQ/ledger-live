import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useAnalyticsFilterSelectViewModel } from "./useAnalyticsFilterSelectViewModel";

const resources = {
  en: {
    translation: {
      common: { search: "Search" },
      accountAnalytics: { noResults: "No results" },
    },
  },
};

function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}

function renderSheet() {
  const props = { onOpenChange: jest.fn(), onValueChange: jest.fn() };
  const view = renderHook(() => useAnalyticsFilterSelectViewModel(props), {
    wrapper: I18nWrapper,
  });
  return { ...view, props };
}

describe("useAnalyticsFilterSelectViewModel", () => {
  it("should open and close the sheet and report both", () => {
    const { result, props } = renderSheet();
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    expect(props.onOpenChange).toHaveBeenLastCalledWith(true);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(props.onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("should close the sheet and report the picked value", () => {
    const { result, props } = renderSheet();
    act(() => result.current.open());
    act(() => result.current.selectOption("btc"));
    expect(result.current.isOpen).toBe(false);
    expect(props.onValueChange).toHaveBeenCalledWith("btc");
  });

  it("should only close the sheet when the list clears its value", () => {
    const { result, props } = renderSheet();
    act(() => result.current.open());
    act(() => result.current.selectOption(null));
    expect(result.current.isOpen).toBe(false);
    expect(props.onValueChange).not.toHaveBeenCalled();
  });

  it("should keep the typed search and clear it when the sheet closes", () => {
    const { result } = renderSheet();
    act(() => result.current.open());
    act(() => result.current.setSearchValue("algo"));
    expect(result.current.searchValue).toBe("algo");
    act(() => result.current.close());
    expect(result.current.searchValue).toBe("");
  });

  it("should clear the search once an option is picked", () => {
    const { result } = renderSheet();
    act(() => result.current.open());
    act(() => result.current.setSearchValue("algo"));
    act(() => result.current.selectOption("algorand"));
    expect(result.current.searchValue).toBe("");
  });

  it("should provide the search wording", () => {
    const { result } = renderSheet();
    expect(result.current.searchPlaceholder).toBe("Search");
    expect(result.current.noResultsTitle).toBe("No results");
  });
});
