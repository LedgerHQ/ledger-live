import React from "react";
import { render, screen } from "tests/testSetup";
import BalanceOptionsSwitch from "./BalanceOptionsSwitch";

describe("BalanceOptionsSwitch", () => {
  it("should render the switch button", () => {
    render(<BalanceOptionsSwitch onClick={jest.fn()} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should call onClick when the button is clicked", async () => {
    const onClick = jest.fn();
    const { user } = render(<BalanceOptionsSwitch onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
