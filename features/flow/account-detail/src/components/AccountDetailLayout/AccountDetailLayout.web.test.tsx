import React from "react";
import { render, screen } from "@testing-library/react";
import { AccountDetailLayout } from "./AccountDetailLayout.web";

const slotIds = () =>
  Array.from(screen.getByTestId("account-detail-layout").children).map(child =>
    child.getAttribute("data-testid"),
  );

describe("AccountDetailLayout (Web)", () => {
  it("renders the sections in page order", () => {
    render(
      <AccountDetailLayout
        hero={<div data-testid="hero" />}
        customPlace={<div data-testid="custom-place" />}
        assets={<div data-testid="assets" />}
        transactions={<div data-testid="transactions" />}
      />,
    );

    expect(slotIds()).toEqual(["hero", "custom-place", "assets", "transactions"]);
  });

  it("skips the custom place when the chain has none", () => {
    render(
      <AccountDetailLayout
        hero={<div data-testid="hero" />}
        assets={<div data-testid="assets" />}
        transactions={<div data-testid="transactions" />}
      />,
    );

    expect(slotIds()).toEqual(["hero", "assets", "transactions"]);
  });
});
