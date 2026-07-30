import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactAddressLabelSchema } from "@domain/entity-contact";
import type { AddAddressLabelState, AddAddressNameLabels } from "./types";
import { ContactsAddAddressName } from "./ContactsAddAddressName.native";

const labels: AddAddressNameLabels = {
  title: "Name address",
  inputLabel: "Address name",
  namingDisclaimer: "Only you can see this name.",
  continueToReview: "Continue to review",
  invalidLabel: "Special characters are not allowed.",
  duplicateLabel: "This address name is already used for this contact.",
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
      value: "Ethereum",
    });
    expect(screen.getByTestId("contacts-add-address-name-disclaimer").props.description).toBe(
      "Only you can see this name.",
    );
    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeEnabled();

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
        value: "Ethereum 💎",
        label: null,
        validationError: "InvalidContactAddressLabelError",
      },
      helperText: "Special characters are not allowed.",
    },
    {
      name: "duplicate label",
      addressLabel: {
        status: "invalid",
        value: "Ethereum",
        label: null,
        validationError: "DuplicateContactAddressLabelError",
      },
      helperText: "This address name is already used for this contact.",
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
