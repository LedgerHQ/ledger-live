import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactAddressLabelSchema, ContactAddressValueSchema } from "@domain/entity-contact";
import {
  ContactsAddAddressFlowContent,
  type ContactsAddAddressFlowContentProps,
} from "./ContactsAddAddressFlowContent";

jest.mock("@shared/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const address = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");

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
      onChangeText: jest.fn(),
      onContinue: jest.fn(),
    },
    addressReviewProps: {
      address,
      currency: "Ethereum",
      network: "Ethereum",
      name: "Ethereum",
      onContinue: jest.fn(),
    },
  };
}

describe("ContactsAddAddressFlowContent", () => {
  it("should render each step and call its action", () => {
    const addressProps = createProps("address");
    const { rerender } = render(<ContactsAddAddressFlowContent {...addressProps} />);

    fireEvent.press(screen.getByTestId("contacts-add-address-confirm"));
    expect(addressProps.addressEntryProps?.onConfirm).toHaveBeenCalledTimes(1);

    const nameProps = createProps("name");
    rerender(<ContactsAddAddressFlowContent {...nameProps} />);

    fireEvent.press(screen.getByTestId("contacts-add-address-name-continue"));
    expect(nameProps.addressNameProps?.onContinue).toHaveBeenCalledTimes(1);

    const reviewProps = createProps("review");
    rerender(<ContactsAddAddressFlowContent {...reviewProps} />);

    expect(screen.getByText(address)).toBeVisible();
    fireEvent.press(screen.getByTestId("contacts-add-address-review-continue"));
    expect(reviewProps.addressReviewProps?.onContinue).toHaveBeenCalledTimes(1);
  });
});
