import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsRenameContactFooter } from ".";
import type { ContactsRenameContactFooterProps } from "./types";

function createProps(
  overrides: Partial<ContactsRenameContactFooterProps> = {},
): ContactsRenameContactFooterProps {
  return {
    isConfirmEnabled: false,
    isSaving: false,
    isDeviceRequired: false,
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe("ContactsRenameContactFooter", () => {
  it("should stay disabled until the draft name is valid", () => {
    render(<ContactsRenameContactFooter {...createProps()} />, { wrapper: I18nTestProvider });

    expect(screen.getByTestId("contacts-rename-contact-confirm")).toHaveProp("disabled", true);
    expect(screen.getByText("contacts.editContact.confirmName")).toBeVisible();
  });

  it("should confirm the rename", () => {
    const onConfirm = jest.fn(async () => undefined);

    render(
      <ContactsRenameContactFooter {...createProps({ isConfirmEnabled: true, onConfirm })} />,
      { wrapper: I18nTestProvider },
    );

    fireEvent.press(screen.getByTestId("contacts-rename-contact-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should show a loading state while saving", () => {
    render(<ContactsRenameContactFooter {...createProps({ isSaving: true })} />, {
      wrapper: I18nTestProvider,
    });

    expect(screen.getByTestId("contacts-rename-contact-confirm")).toHaveProp("loading", true);
  });
});
