import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsAddAddressNameInput } from "./ContactsAddAddressNameInput";
import type { ContactsAddAddressNameProps } from "../../types";

const ADDRESS = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");

function createProps(
  overrides: Partial<ContactsAddAddressNameProps> = {},
): ContactsAddAddressNameProps {
  return {
    addressEntry: {
      status: "valid",
      value: ADDRESS,
      resolvedAddress: ADDRESS,
      inputMethod: "manual",
    },
    addressLabel: {
      status: "valid",
      value: "Ethereum",
      label: ContactAddressLabelSchema.parse("Ethereum"),
      validationError: null,
    },
    showConfirmedAddress: false,
    onAddressLabelChange: jest.fn(),
    onContinue: jest.fn(),
    ...overrides,
  };
}

describe("ContactsAddAddressNameInput", () => {
  it("should render only the name input with the 32-character limit", () => {
    render(<ContactsAddAddressNameInput {...createProps()} />, { wrapper: I18nTestProvider });

    expect(screen.queryByTestId("contacts-add-address-confirmed-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveValue("Ethereum");
    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveAttribute(
      "maxlength",
      "32",
    );
    expect(screen.getByTestId("contacts-add-address-name-disclaimer")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeEnabled();
  });

  it("should forward address-label edits", () => {
    const onAddressLabelChange = jest.fn();
    render(<ContactsAddAddressNameInput {...createProps({ onAddressLabelChange })} />, {
      wrapper: I18nTestProvider,
    });

    fireEvent.change(screen.getByTestId("contacts-add-address-name-input"), {
      target: { value: "Exchange" },
    });

    expect(onAddressLabelChange).toHaveBeenCalledWith("Exchange");
  });

  it.each([
    [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME, "contacts.addAddressName.invalidLabel"],
    [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME, "contacts.addAddressName.duplicateLabel"],
    [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME, "contacts.addAddressName.tooLongLabel"],
  ] as const)("should render the shared %s validation error", (validationError, message) => {
    render(
      <ContactsAddAddressNameInput
        {...createProps({
          addressLabel: {
            status: "invalid",
            value: "Ethereum",
            label: null,
            validationError,
          },
        })}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveAttribute(
      "helpertext",
      message,
    );
    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeDisabled();
  });

  it("should continue only with a valid address label", () => {
    const onContinue = jest.fn();
    const { rerender } = render(<ContactsAddAddressNameInput {...createProps({ onContinue })} />, {
      wrapper: I18nTestProvider,
    });

    fireEvent.click(screen.getByTestId("contacts-add-address-name-continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);

    rerender(
      <ContactsAddAddressNameInput
        {...createProps({
          onContinue,
          addressLabel: { status: "empty", value: "", label: null, validationError: null },
        })}
      />,
    );

    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeDisabled();
  });
});
