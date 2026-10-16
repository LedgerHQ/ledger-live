import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { AccountSettingsMenu } from "./AccountSettingsMenu";

function renderMenu() {
  const handlers = {
    onChangeName: jest.fn(),
    onViewAdvancedLogs: jest.fn(),
    onRemoveAccount: jest.fn(),
  };
  render(<AccountSettingsMenu accountName="Ethereum 1" {...handlers} />, { wrapper: I18nWrapper });
  return handlers;
}

describe("AccountSettingsMenu (Native)", () => {
  it("lists the three settings with the current account name", () => {
    renderMenu();

    expect(screen.getByTestId("account-settings-change-name")).toHaveTextContent(/Change name/);
    expect(screen.getByText("Ethereum 1")).toBeVisible();
    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.getByText("Remove account from portfolio")).toBeVisible();
  });

  it("keeps the account name on a single line", () => {
    renderMenu();

    expect(screen.getByTestId("account-settings-change-name-value")).toHaveProp("numberOfLines", 1);
  });

  it("calls the handler of the pressed setting", () => {
    const handlers = renderMenu();

    fireEvent.press(screen.getByTestId("account-settings-change-name"));
    fireEvent.press(screen.getByTestId("account-settings-advanced-logs"));
    fireEvent.press(screen.getByTestId("account-settings-remove-account"));

    expect(handlers.onChangeName).toHaveBeenCalledTimes(1);
    expect(handlers.onViewAdvancedLogs).toHaveBeenCalledTimes(1);
    expect(handlers.onRemoveAccount).toHaveBeenCalledTimes(1);
  });
});
