import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
import { Receive } from "./Receive";

const renderTool = (enabled = false, excludedFamilies: readonly string[] = []) => {
  const flag = { enabled, excludedFamilies, setEnabled: jest.fn(), setExcludedFamilies: jest.fn() };
  const verifyHint = { hasSeen: false, setHasSeen: jest.fn() };
  const trigger = {
    assets: [],
    onReceive: jest.fn(),
    onPickAsset: jest.fn(),
    onOpenDeeplink: jest.fn(),
  };
  render(<Receive flag={flag} verifyHint={verifyHint} trigger={trigger} />);
  return flag;
};

describe("Receive", () => {
  it("turns the flag on", async () => {
    const flag = renderTool();

    expect(screen.getByRole("heading", { name: "Feature flag" })).toBeVisible();
    await userEvent.click(screen.getByRole("switch", { name: "Enabled" }));
    expect(flag.setEnabled).toHaveBeenCalledWith(true);
  });

  it("applies the excluded families typed in the input", async () => {
    const flag = renderTool(true, ["tron"]);

    const input = screen.getByDisplayValue("tron");
    await userEvent.clear(input);
    await userEvent.type(input, " bitcoin, , tezos ");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(flag.setExcludedFamilies).toHaveBeenCalledWith(["bitcoin", "tezos"]);
  });
});
