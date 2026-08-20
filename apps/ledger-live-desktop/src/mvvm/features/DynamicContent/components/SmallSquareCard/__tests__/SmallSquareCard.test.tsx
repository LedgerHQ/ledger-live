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

  it("should expose a generic accessible name for media-only clickable cards", () => {
    render(<SmallSquareCard media="https://example.com/device.png" onClick={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Content card" })).toBeVisible();
  });

  it("should use the tag as the accessible name when the title is missing", () => {
    render(
      <SmallSquareCard media="https://example.com/device.png" tag="30% off" onClick={jest.fn()} />,
    );

    expect(screen.getByRole("button", { name: "30% off" })).toBeVisible();
  });

  it("should not expose button semantics when the card is not clickable", () => {
    render(<SmallSquareCard title="Ledger Stax" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should highlight the card on hover only when it is clickable", () => {
    const { rerender } = render(<SmallSquareCard title="Ledger Stax" onClick={jest.fn()} />);

    expect(screen.getByTestId("small-square-card")).toHaveClass(
      "group-hover/card:bg-surface-hover",
    );

    rerender(<SmallSquareCard title="Ledger Stax" />);

    expect(screen.getByTestId("small-square-card")).not.toHaveClass(
      "group-hover/card:bg-surface-hover",
    );
  });
});
