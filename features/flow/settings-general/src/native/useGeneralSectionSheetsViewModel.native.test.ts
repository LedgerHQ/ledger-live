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
    });

    expect(result.current.currentLabels).toEqual({
      theme: "Dark",
      language: "Français",
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

  it("closes the sheet", () => {
    const { result } = renderViewModel();

    act(() => result.current.onOpenSheet("currency"));
    act(() => result.current.onCloseSheet());

    expect(result.current.openSheet).toBeNull();
  });
});
