import React from "react";
import { render, screen } from "@tests/test-renderer";
import CryptoAddressesErrorState from "../CryptoAddressesErrorState";

describe("CryptoAddressesErrorState", () => {
  it("should render the error message", () => {
    render(<CryptoAddressesErrorState />);
    expect(screen.getByText("An error occurred while loading your accounts")).toBeVisible();
  });
});
