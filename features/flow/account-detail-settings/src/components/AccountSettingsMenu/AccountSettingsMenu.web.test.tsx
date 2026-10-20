import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("AccountSettingsMenu (Web)", () => {
  it("lists the three settings with the current account name", () => {
    renderMenu();

    expect(screen.getByTestId("account-settings-change-name")).toHaveTextContent("Change name");
    expect(screen.getByTestId("account-settings-change-name")).toHaveTextContent("Ethereum 1");
    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.getByText("Remove account from portfolio")).toBeVisible();
  });

  it("calls the handler of the pressed setting", async () => {
    const user = userEvent.setup();
    const handlers = renderMenu();

    await user.click(screen.getByTestId("account-settings-change-name"));
    await user.click(screen.getByTestId("account-settings-advanced-logs"));
    await user.click(screen.getByTestId("account-settings-remove-account"));

    expect(handlers.onChangeName).toHaveBeenCalledTimes(1);
    expect(handlers.onViewAdvancedLogs).toHaveBeenCalledTimes(1);
    expect(handlers.onRemoveAccount).toHaveBeenCalledTimes(1);
  });
});
