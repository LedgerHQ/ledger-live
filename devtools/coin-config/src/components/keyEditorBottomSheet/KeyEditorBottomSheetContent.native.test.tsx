import { BottomSheetWrapper, fireEvent, render, screen } from "@support/jest/devtools/native";
import type { KeyDisplayState } from "../../types";
import { KeyEditorBottomSheetContent } from "./KeyEditorBottomSheetContent";

const display: KeyDisplayState = {
  key: "config_currency_solana",
  resolved: { token2022Enabled: false },
  defaultValue: { token2022Enabled: false },
  valueType: "object",
  isOverridden: false,
};

describe("KeyEditorBottomSheetContent (native)", () => {
  it("should apply valid JSON as an override", () => {
    const { setOverride } = renderContent();

    fireEvent.changeText(screen.getByLabelText("JSON value"), '{"token2022Enabled":true}');
    fireEvent.press(screen.getByText("Apply"));

    expect(setOverride).toHaveBeenCalledWith("config_currency_solana", { token2022Enabled: true });
  });

  it("should flag invalid JSON and not apply it", () => {
    const { setOverride } = renderContent();

    fireEvent.changeText(screen.getByLabelText("JSON value"), "not json");
    fireEvent.press(screen.getByText("Apply"));

    expect(screen.getByText("Invalid JSON")).toBeOnTheScreen();
    expect(setOverride).not.toHaveBeenCalled();
  });

  it("should restore an overridden key", () => {
    const { clearOverride } = renderContent({ ...display, isOverridden: true });

    expect(screen.getByText("Overridden locally")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Restore"));

    expect(clearOverride).toHaveBeenCalledWith("config_currency_solana");
  });

  it("should show the diff with the default value", () => {
    renderContent({ ...display, defaultValue: { token2022Enabled: false, status: "active" } });

    fireEvent.press(screen.getByText("Review Changes"));

    expect(screen.getByText('-   "status": "active"')).toBeOnTheScreen();
  });
});

function renderContent(state: KeyDisplayState = display) {
  const setOverride = jest.fn();
  const clearOverride = jest.fn();
  render(
    <KeyEditorBottomSheetContent
      display={state}
      setOverride={setOverride}
      clearOverride={clearOverride}
    />,
    { wrapper: BottomSheetWrapper },
  );
  return { setOverride, clearOverride };
}
