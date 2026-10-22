import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsAddContactFooter } from "./ContactsAddContactFooter.native";
import type { ContactsAddContactFooterProps } from "./types";

function createProps(
  overrides: Partial<ContactsAddContactFooterProps> = {},
): ContactsAddContactFooterProps {
  return {
    isConfirmEnabled: false,
    isSaving: false,
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe("ContactsAddContactFooter", () => {
  it("should stay disabled until the draft name is valid", () => {
    render(<ContactsAddContactFooter {...createProps()} />, { wrapper: I18nTestProvider });

    expect(screen.getByTestId("contacts-add-contact-save")).toHaveProp("disabled", true);
    expect(screen.getByText("contacts.addContact")).toBeVisible();
  });

  it("should save the contact", () => {
    const onConfirm = jest.fn(async () => undefined);

    render(<ContactsAddContactFooter {...createProps({ isConfirmEnabled: true, onConfirm })} />, {
      wrapper: I18nTestProvider,
    });

    fireEvent.press(screen.getByTestId("contacts-add-contact-save"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should show a loading state while saving", () => {
    render(<ContactsAddContactFooter {...createProps({ isSaving: true })} />, {
      wrapper: I18nTestProvider,
    });

    expect(screen.getByTestId("contacts-add-contact-save")).toHaveProp("loading", true);
  });
});
