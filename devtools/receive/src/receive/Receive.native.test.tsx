import { fireEvent, render, screen } from "@support/jest/devtools/native";
import { Receive } from "./Receive";

const renderTool = (enabled = false, excludedFamilies: readonly string[] = []) => {
  const flag = { enabled, excludedFamilies, setEnabled: jest.fn(), setExcludedFamilies: jest.fn() };
  render(<Receive flag={flag} />);
  return flag;
};

describe("Receive", () => {
  it("turns the flag on", () => {
    const flag = renderTool();

    expect(screen.getByText("Feature flag")).toBeOnTheScreen();
    fireEvent(screen.getByLabelText("Enabled"), "onCheckedChange", true);
    expect(flag.setEnabled).toHaveBeenCalledWith(true);
  });

  it("applies the excluded families typed in the input", () => {
    const flag = renderTool(true, ["tron"]);

    fireEvent.changeText(screen.getByDisplayValue("tron"), " bitcoin, , tezos ");
    fireEvent.press(screen.getByText("Apply"));
    expect(flag.setExcludedFamilies).toHaveBeenCalledWith(["bitcoin", "tezos"]);
  });
});
