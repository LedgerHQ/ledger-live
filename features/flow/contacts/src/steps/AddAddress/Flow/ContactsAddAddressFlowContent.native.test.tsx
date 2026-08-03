import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import type { AddAddressEntryLabels, AddAddressNameLabels } from "../types";
import {
  ContactsAddAddressFlowContent,
  type ContactsAddAddressFlowContentProps,
} from "./ContactsAddAddressFlowContent.native";

const address = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
const entryLabels: AddAddressEntryLabels = {
  title: "Enter address",
  addressPlaceholder: "Address or ENS",
  confirmAddress: "Confirm address",
  validatingAddress: "Validating address",
  validAddress: "Valid address",
  invalidAddress: "Invalid address",
  domainNotFound: "Domain not found",
  sanctionedAddress: "Address is sanctioned",
  validationUnavailable: "Address validation is unavailable",
  ensDisclaimer: "ENS disclaimer",
};
const nameLabels: AddAddressNameLabels = {
  title: "Address name",
  inputLabel: "Name",
  namingDisclaimer: "Only you can see this name.",
  continueToReview: "Continue to review",
  validationErrors: {
    [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "Invalid characters",
    [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "Duplicate name",
    [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: "Name is too long",
  },
};
function createProps(
  step: ContactsAddAddressFlowContentProps["step"],
): ContactsAddAddressFlowContentProps {
  return {
    step,
    addressEntryProps: {
      addressEntry: {
        status: "valid",
        value: address,
        resolvedAddress: address,
        inputMethod: "manual",
      },
      labels: entryLabels,
      onChangeText: jest.fn(),
      onConfirm: jest.fn(),
      onQrCodeClick: jest.fn(),
    },
    addressNameProps: {
      addressLabel: {
        status: "valid",
        value: "Ethereum",
        label: ContactAddressLabelSchema.parse("Ethereum"),
        validationError: null,
      },
      labels: nameLabels,
      onChangeText: jest.fn(),
      onContinue: jest.fn(),
    },
  };
}

describe("ContactsAddAddressFlowContent", () => {
  it("should render the address and name content with their actions", () => {
    const addressProps = createProps("address");
    const { rerender } = render(<ContactsAddAddressFlowContent {...addressProps} />);

    fireEvent.press(screen.getByTestId("contacts-add-address-confirm"));
    expect(addressProps.addressEntryProps?.onConfirm).toHaveBeenCalledTimes(1);

    const nameProps = createProps("name");
    rerender(<ContactsAddAddressFlowContent {...nameProps} />);

    fireEvent.press(screen.getByTestId("contacts-add-address-name-continue"));
    expect(nameProps.addressNameProps?.onContinue).toHaveBeenCalledTimes(1);
  });
});
