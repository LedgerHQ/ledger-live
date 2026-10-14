import React from "react";
import { View } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { AccountDetailLayout } from "./AccountDetailLayout.native";

type LayoutChild = ReturnType<typeof screen.getByTestId> | string;

const slotIds = () =>
  screen
    .getByTestId("account-detail-layout")
    .children.map((child: LayoutChild) => (typeof child === "string" ? child : child.props.testID));

describe("AccountDetailLayout (Native)", () => {
  it("renders the sections in page order", () => {
    render(
      <AccountDetailLayout
        hero={<View testID="hero" />}
        customPlace={<View testID="custom-place" />}
        assets={<View testID="assets" />}
        transactions={<View testID="transactions" />}
      />,
    );

    expect(slotIds()).toEqual(["hero", "custom-place", "assets", "transactions"]);
  });

  it("skips the custom place when the chain has none", () => {
    render(
      <AccountDetailLayout
        hero={<View testID="hero" />}
        assets={<View testID="assets" />}
        transactions={<View testID="transactions" />}
      />,
    );

    expect(slotIds()).toEqual(["hero", "assets", "transactions"]);
  });
});
