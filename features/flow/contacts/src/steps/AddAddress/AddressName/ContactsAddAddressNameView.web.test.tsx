import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  ContactAddressLabelSchema,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsAddAddressNameView } from "./ContactsAddAddressNameView.web";
import type { ContactsAddAddressNameViewProps } from "./types";

function createProps(
  overrides: Partial<ContactsAddAddressNameViewProps> = {},
): ContactsAddAddressNameViewProps {
  return {
    addressLabel: {
      status: "valid",
      value: "Ethereum",
      label: ContactAddressLabelSchema.parse("Ethereum"),
      validationError: null,
    },
    labels: {
      inputLabel: "Address name",
      namingDisclaimer: "Address naming disclaimer",
      namingDisclaimerAccessibilityLabel: "Address name information",
      continueToReview: "Continue to review",
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
  it("should render only the name input with disclaimer and forward actions", () => {
    const onAddressLabelChange = jest.fn();
    const onContinue = jest.fn();

    render(<ContactsAddAddressNameView {...createProps({ onAddressLabelChange, onContinue })} />);

    expect(screen.queryByTestId("contacts-add-address-confirmed-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveValue("Ethereum");
    expect(screen.getByTestId("contacts-add-address-name-disclaimer")).toBeInTheDocument();

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
