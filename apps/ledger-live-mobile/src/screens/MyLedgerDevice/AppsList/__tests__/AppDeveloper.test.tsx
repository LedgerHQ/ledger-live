import React from "react";
import { render, screen } from "@tests/test-renderer";
import AppDeveloper from "../AppDeveloper";

describe("AppDeveloper", () => {
  it("shows Ledger for an app developed by Ledger", () => {
    render(<AppDeveloper app={{ authorName: "Ledger" }} />);
    expect(screen.getByText("Ledger")).toBeVisible();
  });

  it("shows the developer name for a community app", () => {
    render(<AppDeveloper app={{ authorName: "Vacuumlabs" }} />);
    expect(screen.getByText("Vacuumlabs")).toBeVisible();
  });

  it.each([[""], [null], [undefined]])(
    "falls back to Community app when authorName is %p",
    authorName => {
      render(<AppDeveloper app={{ authorName }} />);
      expect(screen.getByText("Community app")).toBeVisible();
    },
  );
});
