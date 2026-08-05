import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsAddAddressNameView } from "./ContactsAddAddressNameView.web";
import type { ContactsAddAddressNameViewProps } from "./types";

const RESOLVED_ADDRESS = ContactAddressValueSchema.parse(
  "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
);

function createProps(
  overrides: Partial<ContactsAddAddressNameViewProps> = {},
): ContactsAddAddressNameViewProps {
  return {
    address: RESOLVED_ADDRESS,
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
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: "This address name is too long.",
      },
    },
    isContinueEnabled: true,
    onAddressLabelChange: jest.fn(),
    onContinue: jest.fn(),
    ...overrides,
  };
}

describe("ContactsAddAddressNameView", () => {
  it("should render the address details and forward input actions", () => {
    const onAddressLabelChange = jest.fn();
    const onContinue = jest.fn();

    render(<ContactsAddAddressNameView {...createProps({ onAddressLabelChange, onContinue })} />);

    expect(screen.getByTestId("contacts-add-address-confirmed-input")).toHaveAttribute(
      "value",
      RESOLVED_ADDRESS,
    );
    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveValue("Ethereum");

    fireEvent.change(screen.getByTestId("contacts-add-address-name-input"), {
      target: { value: "Exchange" },
    });
    fireEvent.click(screen.getByTestId("contacts-add-address-name-continue"));

    expect(onAddressLabelChange).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("should display an invalid label and disable continuation", () => {
    render(
      <ContactsAddAddressNameView
        {...createProps({
          addressLabel: {
            status: "invalid",
            value: "Ethereum 💎",
            label: null,
            validationError: "InvalidContactAddressLabelError",
          },
          validationMessage: "Special characters are not allowed.",
          isContinueEnabled: false,
        })}
      />,
    );

    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveAttribute(
      "helpertext",
      "Special characters are not allowed.",
    );
    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeDisabled();
  });
});
