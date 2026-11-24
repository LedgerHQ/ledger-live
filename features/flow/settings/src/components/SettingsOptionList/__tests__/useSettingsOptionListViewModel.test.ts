import { act, renderHook } from "@testing-library/react";
import type { SettingsOptionListProps } from "../SettingsOptionList.types";
import { useSettingsOptionListViewModel } from "../useSettingsOptionListViewModel";

const options = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const renderViewModel = (props: Partial<SettingsOptionListProps> = {}) =>
  renderHook(() =>
    useSettingsOptionListViewModel({
      options,
      selectedValue: "dark",
      onSelectOption: jest.fn(),
      ...props,
    }),
  );

describe("useSettingsOptionListViewModel", () => {
  it("marks the selected option", () => {
    const { result } = renderViewModel();

    expect(result.current.items.map(item => [item.value, item.isSelected])).toEqual([
      ["light", false],
      ["dark", true],
      ["system", false],
    ]);
  });

  it("has no search field unless asked for", () => {
    const { result } = renderViewModel();

    expect(result.current.search).toBeUndefined();
    expect(result.current.emptyLabel).toBeUndefined();
  });

  it("filters the options with the search query", () => {
    const { result } = renderViewModel({
      search: { placeholder: "Search", emptyLabel: "No result" },
    });

    act(() => result.current.search?.onChangeQuery("sys"));

    expect(result.current.search?.query).toBe("sys");
    expect(result.current.items.map(item => item.value)).toEqual(["system"]);
    expect(result.current.emptyLabel).toBeUndefined();
  });

  it("gives the empty label when nothing matches", () => {
    const { result } = renderViewModel({
      search: { placeholder: "Search", emptyLabel: "No result" },
    });

    act(() => result.current.search?.onChangeQuery("blue"));

    expect(result.current.items).toEqual([]);
    expect(result.current.emptyLabel).toBe("No result");
  });
});
