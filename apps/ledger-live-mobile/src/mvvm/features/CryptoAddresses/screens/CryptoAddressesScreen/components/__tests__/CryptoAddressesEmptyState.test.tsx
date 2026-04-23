import React from "react";
import { render, screen } from "@tests/test-renderer";
import CryptoAddressesEmptyState from "../CryptoAddressesEmptyState";

describe("CryptoAddressesEmptyState", () => {
  it("should render the empty state label", () => {
    render(<CryptoAddressesEmptyState label="No accounts yet" />);
    expect(screen.getByText("No accounts yet")).toBeVisible();
  });
});
