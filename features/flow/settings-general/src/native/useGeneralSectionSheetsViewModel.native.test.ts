import { act, renderHook } from "@testing-library/react-native";
import { makeSettingsWrapper } from "../__tests__/settingsWrapper";
import { createFakeGeneralPort } from "../__tests__/fakeGeneralPort";
import { useGeneralSectionSheetsViewModel } from "./useGeneralSectionSheetsViewModel";

function renderViewModel(...args: Parameters<typeof createFakeGeneralPort>) {
  const fake = createFakeGeneralPort(...args);
  const hook = renderHook(() => useGeneralSectionSheetsViewModel(), {
    wrapper: makeSettingsWrapper(fake.port),
  });
  return { ...hook, ...fake };
}

describe("useGeneralSectionSheetsViewModel", () => {
  it("shows the label of each current value", () => {
    const { result } = renderViewModel({
      theme: "dark",
      language: "fr",
      currency: "EUR",
      dateFormat: "DD/MM/YYYY",
    });

    expect(result.current.currentLabels).toEqual({
      theme: "Dark",
      language: "Français",
      dateFormat: "DD/MM/YYYY",
      currency: "EUR",
    });
  });

  it("opens no sheet at first", () => {
    const { result } = renderViewModel();

    expect(result.current.openSheet).toBeNull();
  });

  it.each([
    ["theme", "Select theme", false],
    ["language", "Select language", true],
    ["dateFormat", "Select date format", false],
    ["currency", "Select currency", true],
  ] as const)("opens the %s sheet with its title and search", (id, title, hasSearch) => {
    const { result } = renderViewModel();

    act(() => result.current.onOpenSheet(id));

    expect(result.current.openSheet).toMatchObject({ id, title, hasSearch });
  });

  it("stores the option picked in a sheet", () => {
    const { result, updates } = renderViewModel();

    act(() => result.current.onOpenSheet("theme"));
    act(() => result.current.openSheet?.onSelect("light"));

    expect(updates).toEqual([{ key: "theme", value: "light" }]);
  });

  it("offers the three date formats and stores the picked one", () => {
    const { result, updates } = renderViewModel();

    act(() => result.current.onOpenSheet("dateFormat"));

    expect(result.current.openSheet?.options).toEqual([
      { value: "default", label: "Default" },
      { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
      { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    ]);
    expect(result.current.currentLabels.dateFormat).toBe("Default");

    act(() => result.current.openSheet?.onSelect("MM/DD/YYYY"));
    act(() => result.current.openSheet?.onSelect("YYYY"));

    expect(updates).toEqual([{ key: "dateFormat", value: "MM/DD/YYYY" }]);
  });

  it("closes the sheet", () => {
    const { result } = renderViewModel();

    act(() => result.current.onOpenSheet("currency"));
    act(() => result.current.onCloseSheet());

    expect(result.current.openSheet).toBeNull();
  });
});
