import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CardPrimaryActionButton } from "./CardPrimaryActionButton.web";

describe("CardPrimaryActionButton (web)", () => {
  afterEach(cleanup);

  it("shows the label and runs the action when clicked", () => {
    const onPress = jest.fn();

    render(<CardPrimaryActionButton label="Choose card type" onPress={onPress} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose card type" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
