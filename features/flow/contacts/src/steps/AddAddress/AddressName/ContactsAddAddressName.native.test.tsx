import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  ContactAddressLabelSchema,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import type { AddAddressLabelState, AddAddressNameLabels } from "../Flow/types";
import { ContactsAddAddressName } from "./ContactsAddAddressName.native";

const labels: AddAddressNameLabels = {
  title: "Name address",
  inputLabel: "Address name",
  namingDisclaimer: "Only you can see this name.",
  continueToReview: "Continue to review",
  validationErrors: {
    [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "Special characters are not allowed.",
    [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]:
      "This address name is already used for this contact.",
    [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: "This address name is too long.",
  },
};

describe("ContactsAddAddressName", () => {
  it("should render the default label with an enabled review action", () => {
    const onChangeText = jest.fn();
    const onContinue = jest.fn();

    render(
      <ContactsAddAddressName
        addressLabel={{
          status: "valid",
          value: "Ethereum",
          label: ContactAddressLabelSchema.parse("Ethereum"),
          validationError: null,
        }}
        labels={labels}
        onChangeText={onChangeText}
        onContinue={onContinue}
      />,
    );

    expect(screen.UNSAFE_getByProps({ title: "Name address" }).props.title).toBe("Name address");
    expect(screen.getByTestId("contacts-add-address-name-input").props).toMatchObject({
      label: "Address name",
      maxLength: CONTACT_ADDRESS_LABEL_MAX_LENGTH,
      value: "Ethereum",
    });
    expect(screen.getByTestId("contacts-add-address-name-count")).toHaveTextContent("8/32");
    expect(screen.getByTestId("contacts-add-address-name-disclaimer").props.description).toBe(
      "Only you can see this name.",
    );
    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeEnabled();
    expect(screen.getByTestId("contacts-add-address-name-continue").props.icon).toEqual(
      expect.any(Function),
    );

    fireEvent.changeText(screen.getByTestId("contacts-add-address-name-input"), "Exchange");
    fireEvent.press(screen.getByTestId("contacts-add-address-name-continue"));

    expect(onChangeText).toHaveBeenCalledWith("Exchange");
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: "invalid characters",
      addressLabel: {
        status: "invalid",
        value: "Ethér",
        label: null,
        validationError: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
      },
      helperText: "Special characters are not allowed.",
    },
    {
      name: "duplicate label",
      addressLabel: {
        status: "invalid",
        value: "Ethereum",
        label: null,
        validationError: DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
      },
      helperText: "This address name is already used for this contact.",
    },
    {
      name: "too long label",
      addressLabel: {
        status: "invalid",
        value: "E".repeat(CONTACT_ADDRESS_LABEL_MAX_LENGTH + 1),
        label: null,
        validationError: CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
      },
      helperText: "This address name is too long.",
    },
    {
      name: "empty label",
      addressLabel: {
        status: "empty",
        value: "",
        label: null,
        validationError: null,
      },
      helperText: undefined,
    },
  ] satisfies ReadonlyArray<{
    name: string;
    addressLabel: AddAddressLabelState;
    helperText: string | undefined;
  }>)("should block the $name state", ({ addressLabel, helperText }) => {
    render(
      <ContactsAddAddressName
        addressLabel={addressLabel}
        labels={labels}
        onChangeText={jest.fn()}
        onContinue={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-add-address-name-input").props).toMatchObject({
      value: addressLabel.value,
      ...(helperText === undefined ? {} : { helperText, status: "error" }),
    });
    expect(screen.getByTestId("contacts-add-address-name-continue").props.disabled).toBe(true);
  });
});
