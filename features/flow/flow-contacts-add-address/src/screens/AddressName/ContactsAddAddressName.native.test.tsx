import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  ContactAddressLabelSchema,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { AddAddressLabelState } from "../../state/types";
import { ContactsAddAddressName } from "./ContactsAddAddressName";
import { urls } from "../../urls";

const mockOpenLink = jest.fn();

jest.mock("@shared/linking", () => ({
  useOpenLink: () => mockOpenLink,
  useLocalizedUrl: (url: string) => url,
}));

function renderName(ui: React.ReactElement) {
  return render(ui, { wrapper: I18nTestProvider });
}

describe("ContactsAddAddressName", () => {
  beforeEach(() => {
    mockOpenLink.mockClear();
  });

  it("should render the default label with an enabled review action", () => {
    const onChangeText = jest.fn();
    const onContinue = jest.fn();

    renderName(
      <ContactsAddAddressName
        addressLabel={{
          status: "valid",
          value: "Ethereum",
          label: ContactAddressLabelSchema.parse("Ethereum"),
          validationError: null,
        }}
        onChangeText={onChangeText}
        onContinue={onContinue}
      />,
    );

    expect(screen.UNSAFE_getByProps({ title: "contacts.addAddressName.title" }).props.title).toBe(
      "contacts.addAddressName.title",
    );
    expect(screen.getByTestId("contacts-add-address-name-input").props).toMatchObject({
      label: "contacts.addAddressName.inputLabel",
      maxLength: CONTACT_ADDRESS_LABEL_MAX_LENGTH,
      value: "Ethereum",
    });
    expect(screen.getByTestId("contacts-add-address-name-count")).toHaveTextContent("8/32");
    expect(screen.getByTestId("contacts-add-address-name-disclaimer").props.description).toBe(
      "contacts.addAddressName.namingDisclaimer",
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

  it("should use the short continue label when the next step is confirmation", () => {
    renderName(
      <ContactsAddAddressName
        addressLabel={{
          status: "valid",
          value: "Ethereum",
          label: ContactAddressLabelSchema.parse("Ethereum"),
          validationError: null,
        }}
        nextStep="confirmation"
        onChangeText={jest.fn()}
        onContinue={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-add-address-name-continue")).toHaveTextContent(
      "common.continue",
    );
  });

  it("should keep the continuation above the keyboard inset", () => {
    renderName(
      <ContactsAddAddressName
        addressLabel={{
          status: "valid",
          value: "Ethereum",
          label: ContactAddressLabelSchema.parse("Ethereum"),
          validationError: null,
        }}
        bottomOffset={320}
        onChangeText={jest.fn()}
        onContinue={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-add-address-name-screen")).toHaveStyle({
      bottom: 0,
      paddingBottom: 320,
    });
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
      helperText: "contacts.addAddressName.invalidLabel",
    },
    {
      name: "duplicate label",
      addressLabel: {
        status: "invalid",
        value: "Ethereum",
        label: null,
        validationError: DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
      },
      helperText: "contacts.addAddressName.duplicateLabel",
    },
    {
      name: "too long label",
      addressLabel: {
        status: "invalid",
        value: "E".repeat(CONTACT_ADDRESS_LABEL_MAX_LENGTH + 1),
        label: null,
        validationError: CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
      },
      helperText: "contacts.addAddressName.tooLongLabel",
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
    renderName(
      <ContactsAddAddressName
        addressLabel={addressLabel}
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

  it("should render and open the privacy policy link", () => {
    renderName(
      <ContactsAddAddressName
        addressLabel={{
          status: "valid",
          value: "Ethereum",
          label: ContactAddressLabelSchema.parse("Ethereum"),
          validationError: null,
        }}
        onChangeText={jest.fn()}
        onContinue={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-add-address-name-privacy-policy")).toBeTruthy();
    fireEvent.press(screen.getByTestId("contacts-add-address-name-privacy-policy"));
    expect(mockOpenLink).toHaveBeenCalledWith(urls.privacyPolicy.native);
  });
});
