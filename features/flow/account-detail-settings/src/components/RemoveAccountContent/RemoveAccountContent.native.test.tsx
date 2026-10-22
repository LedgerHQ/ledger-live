import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { RemoveAccountContent } from "./RemoveAccountContent";

describe("RemoveAccountContent (Native)", () => {
  it("asks for confirmation and calls the matching handler", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<RemoveAccountContent onConfirm={onConfirm} onCancel={onCancel} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText("Remove account?")).toBeVisible();
    expect(screen.getByText(/will no longer be visible in your portfolio/)).toBeVisible();

    fireEvent.press(screen.getByTestId("account-settings-remove-confirm"));
    fireEvent.press(screen.getByTestId("account-settings-remove-cancel"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
