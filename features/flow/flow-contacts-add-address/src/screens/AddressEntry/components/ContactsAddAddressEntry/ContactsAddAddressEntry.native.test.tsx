import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactAddressValueSchema } from "@domain/entity-contact";
import type { AddAddressEntryState } from "../../../../state/types";
import { ContactsAddAddressEntry } from "./ContactsAddAddressEntry";

jest.mock("@shared/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const VALID_ADDRESS = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");

function renderEntry(addressEntry: AddAddressEntryState, bottomOffset?: number) {
  const onChangeText = jest.fn();
  const onConfirm = jest.fn();
  const onQrCodeClick = jest.fn();

  render(
    <ContactsAddAddressEntry
      addressEntry={addressEntry}
      {...(bottomOffset === undefined ? {} : { bottomOffset })}
      onChangeText={onChangeText}
      onConfirm={onConfirm}
      onQrCodeClick={onQrCodeClick}
    />,
  );

  return { onChangeText, onConfirm, onQrCodeClick };
}

describe("ContactsAddAddressEntry", () => {
  it("should render an empty address entry with QR access and a disabled confirmation", () => {
    const { onQrCodeClick } = renderEntry({
      status: "empty",
      value: "",
      resolvedAddress: null,
      inputMethod: null,
    });

    const addressInput = screen.getByTestId("contacts-add-address-input");
    expect(screen.UNSAFE_getByProps({ title: "contacts.addAddressEntry.title" }).props.title).toBe(
      "contacts.addAddressEntry.title",
    );
    expect(addressInput.props.placeholder).toBe("contacts.addAddressEntry.addressPlaceholder");
    expect(screen.getByTestId("contacts-add-address-entry-screen")).toHaveStyle({
      bottom: 0,
      paddingBottom: 32,
    });
    expect(screen.getByTestId("contacts-add-address-confirm").props.disabled).toBe(true);

    fireEvent(addressInput, "qrCodeClick");

    expect(onQrCodeClick).toHaveBeenCalledTimes(1);
  });

  it("should submit manual input changes", () => {
    const { onChangeText } = renderEntry({
      status: "empty",
      value: "",
      resolvedAddress: null,
      inputMethod: null,
    });

    fireEvent.changeText(screen.getByTestId("contacts-add-address-input"), "0");

    expect(onChangeText).toHaveBeenCalledWith("0", "manual");
  });

  it("should keep the confirmation above the keyboard inset", () => {
    renderEntry(
      {
        status: "empty",
        value: "",
        resolvedAddress: null,
        inputMethod: null,
      },
      320,
    );

    expect(screen.getByTestId("contacts-add-address-entry-screen")).toHaveStyle({
      bottom: 0,
      paddingBottom: 320,
    });
  });

  it("should identify content inserted in one native event as a paste", () => {
    const { onChangeText } = renderEntry({
      status: "empty",
      value: "",
      resolvedAddress: null,
      inputMethod: null,
    });
    const input = screen.getByTestId("contacts-add-address-input");

    fireEvent.changeText(input, VALID_ADDRESS);

    expect(onChangeText).toHaveBeenCalledWith(VALID_ADDRESS, "paste");
  });

  it.each([
    ["0xabdc", "manual"],
    ["0xabXYZc", "paste"],
  ] as const)(
    "should identify the %s insertion inside the current value as %s",
    (value, inputMethod) => {
      const { onChangeText } = renderEntry({
        status: "validating",
        value: "0xabc",
        resolvedAddress: null,
        inputMethod: "manual",
      });

      fireEvent.changeText(screen.getByTestId("contacts-add-address-input"), value);

      expect(onChangeText).toHaveBeenCalledWith(value, inputMethod);
    },
  );

  it("should render validation progress with confirmation disabled", () => {
    renderEntry({
      status: "validating",
      value: VALID_ADDRESS,
      resolvedAddress: null,
      inputMethod: "manual",
    });

    expect(screen.getByTestId("contacts-add-address-input").props.helperText).toBe(
      "contacts.addAddressEntry.validatingAddress",
    );
    expect(screen.getByTestId("contacts-add-address-confirm").props.disabled).toBe(true);
  });

  it("should render the sanctioned banner without a redundant helper", () => {
    render(
      <ContactsAddAddressEntry
        addressEntry={{
          status: "invalid",
          value: VALID_ADDRESS,
          resolvedAddress: null,
          inputMethod: "manual",
          error: "sanctioned",
        }}
        sanctionedAddressBanner={{
          description: "This wallet address is sanctioned.",
          actionLabel: "Learn more",
          onAction: jest.fn(),
        }}
        onChangeText={jest.fn()}
        onConfirm={jest.fn()}
        onQrCodeClick={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-add-address-input").props).toMatchObject({
      helperText: undefined,
      status: "error",
    });
    expect(screen.getByTestId("contacts-sanctioned-address-banner")).toBeVisible();
    expect(screen.getByTestId("contacts-add-address-confirm").props.disabled).toBe(true);
  });

  it("should render a valid address with confirmation enabled", () => {
    const { onConfirm } = renderEntry({
      status: "valid",
      value: VALID_ADDRESS,
      resolvedAddress: VALID_ADDRESS,
      inputMethod: "manual",
    });

    expect(screen.getByTestId("contacts-add-address-input").props).toMatchObject({
      helperText: "contacts.addAddressEntry.validAddress",
      status: "success",
    });
    expect(screen.getByTestId("contacts-add-address-confirm").props.disabled).toBe(false);

    fireEvent.press(screen.getByTestId("contacts-add-address-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["invalid_format", "contacts.addAddressEntry.invalidAddress"],
    ["domain_not_found", "contacts.addAddressEntry.domainNotFound"],
    ["sanctioned", "contacts.addAddressEntry.sanctionedAddress"],
  ] as const)("should render the %s error", (error, expectedMessage) => {
    renderEntry({
      status: "invalid",
      value: "invalid",
      resolvedAddress: null,
      inputMethod: error === "domain_not_found" ? "ens" : "manual",
      error,
    });

    expect(screen.getByTestId("contacts-add-address-input").props).toMatchObject({
      helperText: expectedMessage,
      status: "error",
    });
    expect(screen.getByTestId("contacts-add-address-confirm").props.disabled).toBe(true);
  });

  it("should render validation unavailability as a blocking error", () => {
    renderEntry({
      status: "unavailable",
      value: VALID_ADDRESS,
      resolvedAddress: null,
      inputMethod: "manual",
    });

    expect(screen.getByTestId("contacts-add-address-input").props).toMatchObject({
      helperText: "contacts.addAddressEntry.validationUnavailable",
      status: "error",
    });
    expect(screen.getByTestId("contacts-add-address-confirm").props.disabled).toBe(true);
  });

  it("should render the ENS disclaimer when the shared state marks the input as ENS", () => {
    renderEntry({
      status: "valid",
      value: "ledger.eth",
      resolvedAddress: VALID_ADDRESS,
      inputMethod: "ens",
    });

    expect(screen.getByTestId("contacts-add-address-ens-disclaimer").props.title).toBe(
      "contacts.addAddressEntry.ensDisclaimer",
    );
    expect(screen.getByTestId("contacts-add-address-ens-disclaimer").props.description).toBe(
      "contacts.addAddressEntry.ensDisclaimerDescription",
    );
  });
});
