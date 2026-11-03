import React from "react";
import { render, screen } from "@testing-library/react";
import { AccountDetailLayout } from "./AccountDetailLayout.web";

const slotIds = () =>
  [
    ...screen.getByTestId("account-detail-layout").children,
    ...screen.getByTestId("account-detail-layout-sections").children,
  ]
    .map(child => child.getAttribute("data-testid"))
    .filter(id => id !== "account-detail-layout-sections");

describe("AccountDetailLayout (Web)", () => {
  it("renders the sections in page order", () => {
    render(
      <AccountDetailLayout
        hero={<div data-testid="hero" />}
        customPlace={<div data-testid="custom-place" />}
        analyticsNotice={<div data-testid="analytics-notice" />}
        assets={<div data-testid="assets" />}
        transactions={<div data-testid="transactions" />}
      />,
    );

    expect(slotIds()).toEqual([
      "hero",
      "custom-place",
      "analytics-notice",
      "assets",
      "transactions",
    ]);
  });

  it("should preserve the section order when no Analytics notice is supplied", () => {
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
