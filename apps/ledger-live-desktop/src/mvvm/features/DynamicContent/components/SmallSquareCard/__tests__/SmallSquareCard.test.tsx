import React from "react";
import { render, screen } from "tests/testSetup";

import SmallSquareCard from "..";

describe("SmallSquareCard", () => {
  it.each(["{Enter}", " "])("should activate the card with %s", async key => {
    const onClick = jest.fn();
    const { user } = render(<SmallSquareCard title="Ledger Stax" onClick={onClick} />);

    screen.getByRole("button", { name: "Ledger Stax" }).focus();
    await user.keyboard(key);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should dismiss without activating the card from the keyboard", async () => {
    const onClick = jest.fn();
    const onDismiss = jest.fn();
    const { user } = render(
      <SmallSquareCard title="Ledger Stax" isDismissable onClick={onClick} onDismiss={onDismiss} />,
    );

    screen.getByRole("button", { name: "Dismiss" }).focus();
    await user.keyboard("{Enter}");

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("should not expose button semantics when the card is not clickable", () => {
    render(<SmallSquareCard title="Ledger Stax" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
