import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DarkenScreen } from "./DarkenScreen.web";

describe("DarkenScreen", () => {
  it("renders a full-screen overlay", () => {
    const { container } = render(<DarkenScreen />);
    const overlay = container.querySelector(".fixed");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("inset-0");
  });

  it("calls onClick when the overlay is clicked", async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<DarkenScreen onClick={onClick} />);
    await user.click(container.querySelector(".fixed")!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not throw when clicked without an onClick handler", async () => {
    const user = userEvent.setup();
    const { container } = render(<DarkenScreen />);
    await expect(user.click(container.querySelector(".fixed")!)).resolves.not.toThrow();
  });
});
