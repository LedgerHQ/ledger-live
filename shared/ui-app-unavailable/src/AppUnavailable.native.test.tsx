import React from "react";
import { render, screen } from "@testing-library/react-native";
import { AppUnavailable } from "./AppUnavailable.native";

const TITLE = "Ledger Wallet is currently unavailable";
const DESCRIPTION = "This does not impact your assets. Please try again later.";

describe("AppUnavailable", () => {
  it("should show the title and description", () => {
    render(<AppUnavailable title={TITLE} description={DESCRIPTION} />);

    expect(screen.getByRole("header", { name: TITLE })).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
  });

  it("should not render an action", () => {
    render(<AppUnavailable title={TITLE} description={DESCRIPTION} />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
