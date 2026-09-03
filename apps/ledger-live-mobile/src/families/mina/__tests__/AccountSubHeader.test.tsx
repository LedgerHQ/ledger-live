import React from "react";
import { render, screen } from "@tests/test-renderer";
import MinaAccountSubHeader from "../AccountSubHeader";

describe("MinaAccountSubHeader", () => {
  it("credits the team behind the mina integration", () => {
    render(<MinaAccountSubHeader />);

    expect(screen.getByText("Powered by Zondax")).toBeOnTheScreen();
    expect(screen.getByText("More info")).toBeOnTheScreen();
  });
});
