import React from "react";
import { renderWithReactQuery } from "@tests/test-renderer";
import AccountsEmptyList from "../AccountsEmptyList/index";
import { track } from "~/analytics";
import { Linking } from "react-native";

describe("AccountsEmptyList", () => {
  it("should render the empty list screen", () => {
    const { getByText } = renderWithReactQuery(
      <AccountsEmptyList sourceScreenName="AccountsEmptyList" />,
    );
    expect(getByText(/no accounts found/i)).toBeVisible();
    expect(
      getByText(/looks like you haven’t added an account yet. get started now/i),
    ).toBeVisible();
    expect(getByText("Add an account")).toBeVisible();
    expect(getByText(/need help\? learn how to add an account to ledger live./i)).toBeVisible();
  });

  it("should trigger the track on the button and open the drawer", async () => {
    const { getByText, user } = renderWithReactQuery(
      <AccountsEmptyList sourceScreenName="AccountsEmptyList" />,
    );
    expect(getByText("Add an account")).toBeVisible();
    await user.press(getByText("Add an account"));
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Add a new account",
      page: "AccountsEmptyList",
    });
    expect(getByText(/add another account/i)).toBeVisible();
  });

  it("should trigger the openUrl with good url", async () => {
    const { getByText, user } = renderWithReactQuery(
      <AccountsEmptyList sourceScreenName="AccountsEmptyList" />,
    );
    const url = "https://support.ledger.com/article/4404389482641-zd";
    const link = getByText(/need help\? learn how to add an account to ledger live./i);
    expect(link).toBeVisible();
    await user.press(link);
    expect(Linking.openURL).toHaveBeenCalledWith(url);
  });
});
