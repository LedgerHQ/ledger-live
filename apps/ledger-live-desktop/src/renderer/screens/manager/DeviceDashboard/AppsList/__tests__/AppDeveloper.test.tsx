import React from "react";
import { render, screen } from "tests/testSetup";
import AppDeveloper from "../AppDeveloper";

describe("AppDeveloper", () => {
  it("shows Ledger for an app developed by Ledger", () => {
    render(<AppDeveloper app={{ authorName: "Ledger" }} />);
    expect(screen.getByTestId("manager-app-developer")).toHaveTextContent("Ledger");
  });

  it("shows the developer name for a community app", () => {
    render(<AppDeveloper app={{ authorName: "Vacuumlabs" }} />);
    expect(screen.getByTestId("manager-app-developer")).toHaveTextContent("Vacuumlabs");
  });

  it.each([[""], [null], [undefined]])(
    "falls back to Community app when authorName is %p",
    authorName => {
      render(<AppDeveloper app={{ authorName }} />);
      expect(screen.getByTestId("manager-app-developer")).toHaveTextContent("Community app");
    },
  );
});
