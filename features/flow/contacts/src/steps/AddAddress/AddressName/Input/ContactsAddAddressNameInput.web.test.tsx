import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
} from "@domain/entity-contact";
import { ContactsAddAddressNameInput } from "./ContactsAddAddressNameInput.web";
import type { ContactsAddAddressNameProps } from "../types";

const RESOLVED_ADDRESS = ContactAddressValueSchema.parse(
  "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
);

function createProps(
  overrides: Partial<ContactsAddAddressNameProps> = {},
): ContactsAddAddressNameProps {
  return {
    addressEntry: {
      status: "valid",
      value: RESOLVED_ADDRESS,
      resolvedAddress: RESOLVED_ADDRESS,
      inputMethod: "manual",
    },
    addressLabel: {
      status: "valid",
      value: "Ethereum",
      label: ContactAddressLabelSchema.parse("Ethereum"),
      validationError: null,
    },
    labels: {
      inputLabel: "Address name",
      continueToReview: "Continue to review",
      validAddress: "Valid address",
      validationErrors: {
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "Special characters are not allowed.",
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]:
          "This address name is already used for this contact.",
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]:
          "Address names must be 32 characters or fewer.",
      },
    },
    onAddressLabelChange: jest.fn(),
    onContinue: jest.fn(),
    ...overrides,
  };
}

describe("ContactsAddAddressNameInput", () => {
  it("should render the confirmed address and prefilled label with the 32-character limit", () => {
    render(<ContactsAddAddressNameInput {...createProps()} />);

    expect(screen.getByTestId("contacts-add-address-confirmed-input")).toHaveAttribute(
      "value",
      RESOLVED_ADDRESS,
    );
    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveValue("Ethereum");
    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveAttribute(
      "maxlength",
      "32",
    );
    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeEnabled();
  });

  it("should forward address-label edits", () => {
    const onAddressLabelChange = jest.fn();
    render(<ContactsAddAddressNameInput {...createProps({ onAddressLabelChange })} />);

    fireEvent.change(screen.getByTestId("contacts-add-address-name-input"), {
      target: { value: "Exchange" },
    });

    expect(onAddressLabelChange).toHaveBeenCalledWith("Exchange");
  });

  it.each([
    [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME, "Special characters are not allowed."],
    [
      DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
      "This address name is already used for this contact.",
    ],
    [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME, "Address names must be 32 characters or fewer."],
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
    );

    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveAttribute(
      "helpertext",
      message,
    );
    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeDisabled();
  });

  it("should continue only with a valid address label", () => {
    const onContinue = jest.fn();
    const { rerender } = render(<ContactsAddAddressNameInput {...createProps({ onContinue })} />);

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
