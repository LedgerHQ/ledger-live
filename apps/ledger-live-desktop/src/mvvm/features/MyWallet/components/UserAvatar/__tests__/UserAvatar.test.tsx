import React from "react";
import { render, screen } from "tests/testSetup";
import { UserAvatar } from "../index";

describe("UserAvatar", () => {
  it("renders the avatar with the correct testid", () => {
    render(<UserAvatar />);

    expect(screen.getByTestId("my-wallet-avatar")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Avatar" })).toBeInTheDocument();
  });
});
