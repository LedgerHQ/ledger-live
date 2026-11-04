import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
import { AccountAnalyticsIntroduction } from "./AccountAnalyticsIntroduction";

describe("AccountAnalyticsIntroduction", () => {
  it("resets a dismissed card", async () => {
    const onReset = jest.fn();
    render(<AccountAnalyticsIntroduction hasDismissed onReset={onReset} />);

    expect(screen.getByText(/^Dismissed/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("disables the reset while the card is visible", () => {
    render(<AccountAnalyticsIntroduction hasDismissed={false} onReset={jest.fn()} />);

    expect(screen.getByText(/^Visible/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });
});
