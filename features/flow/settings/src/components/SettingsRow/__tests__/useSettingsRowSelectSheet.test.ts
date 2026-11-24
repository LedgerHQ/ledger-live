import { act, renderHook } from "@testing-library/react";
import { useSettingsRowSelectSheet } from "../components/SettingsRowSelect/useSettingsRowSelectSheet";

const options = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const renderSheet = (onSelectOption = jest.fn()) =>
  renderHook(() =>
    useSettingsRowSelectSheet({ type: "select", value: "dark", options, onSelectOption }),
  );

describe("useSettingsRowSelectSheet", () => {
  it("starts closed with the current label and the options as list items", () => {
    const { result } = renderSheet();

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedLabel).toBe("Dark");
    expect(result.current.items).toEqual(options);
  });

  it("opens and closes the sheet", () => {
    const { result } = renderSheet();

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("reports a new option and closes the sheet", () => {
    const onSelectOption = jest.fn();
    const { result } = renderSheet(onSelectOption);

    act(() => result.current.open());
    act(() => result.current.onValueChange("light"));

    expect(onSelectOption).toHaveBeenCalledWith("light");
    expect(result.current.isOpen).toBe(false);
  });

  it("closes without reporting when the current option or nothing is picked", () => {
    const onSelectOption = jest.fn();
    const { result } = renderSheet(onSelectOption);

    act(() => result.current.open());
    act(() => result.current.onValueChange("dark"));
    act(() => result.current.open());
    act(() => result.current.onValueChange(null));

    expect(onSelectOption).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });
});
