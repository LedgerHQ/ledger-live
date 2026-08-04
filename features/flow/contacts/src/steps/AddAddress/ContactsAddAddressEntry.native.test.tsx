import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactAddressValueSchema } from "@domain/entity-contact";
import type { AddAddressEntryLabels, AddAddressEntryState } from "./types";
import { ContactsAddAddressEntry } from "./ContactsAddAddressEntry.native";

const labels: AddAddressEntryLabels = {
  title: "Enter address",
  addressPlaceholder: "Address or ENS",
  confirmAddress: "Confirm address",
  validatingAddress: "Validating address",
  validAddress: "Valid address",
  invalidAddress: "Invalid address",
  domainNotFound: "No address found for this domain",
  sanctionedAddress: "This address is sanctioned and cannot be used.",
  validationUnavailable: "Address validation is unavailable",
  ensDisclaimer: "ENS names resolve to wallet addresses.",
};

const VALID_ADDRESS = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");

function renderEntry(addressEntry: AddAddressEntryState, bottomOffset?: number) {
  const onChangeText = jest.fn();
  const onConfirm = jest.fn();
  const onQrCodeClick = jest.fn();

  render(
    <ContactsAddAddressEntry
      addressEntry={addressEntry}
      labels={labels}
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
    expect(screen.UNSAFE_getByProps({ title: "Enter address" }).props.title).toBe("Enter address");
    expect(addressInput.props.placeholder).toBe("Address or ENS");
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

  it("should keep the confirmation above the keyboard offset", () => {
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
      bottom: 320,
      paddingBottom: 32,
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
      "Validating address",
    );
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
      helperText: "Valid address",
      status: "success",
    });
    expect(screen.getByTestId("contacts-add-address-confirm").props.disabled).toBe(false);

    fireEvent.press(screen.getByTestId("contacts-add-address-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["invalid_format", "Invalid address"],
    ["domain_not_found", "No address found for this domain"],
    ["sanctioned", "This address is sanctioned and cannot be used."],
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
        labels={labels}
        sanctionedBanner={{
          description: "This wallet address is sanctioned.",
          actionLabel: "Learn more",
          onAction: jest.fn(),
          testID: "contacts-sanctioned-address-banner",
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
    expect(screen.getByTestId("contacts-sanctioned-address-banner")).toBeTruthy();
  });

  it("should render validation unavailability as a blocking error", () => {
    renderEntry({
      status: "unavailable",
      value: VALID_ADDRESS,
      resolvedAddress: null,
      inputMethod: "manual",
    });

    expect(screen.getByTestId("contacts-add-address-input").props).toMatchObject({
      helperText: "Address validation is unavailable",
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

    expect(screen.getByTestId("contacts-add-address-ens-disclaimer").props.description).toBe(
      "ENS names resolve to wallet addresses.",
    );
  });
});
