import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactAddressValueSchema } from "@domain/entity-contact";
import type { AddAddressEntryLabels, AddAddressEntryState } from "./types";
import { ContactsAddAddressEntryView } from "./ContactsAddAddressEntryView.native";

const labels: AddAddressEntryLabels = {
  title: "Enter address",
  addressPlaceholder: "Address or ENS",
  confirmAddress: "Confirm address",
  validatingAddress: "Validating address",
  validAddress: "Valid address",
  invalidAddress: "Invalid address",
  domainNotFound: "No address found for this domain",
  validationUnavailable: "Address validation is unavailable",
  ensDisclaimer: "ENS names resolve to wallet addresses.",
};

const VALID_ADDRESS = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");

function renderEntry(
  addressEntry: AddAddressEntryState,
  insets: Readonly<{ bottomInset?: number; keyboardInset?: number }> = {},
) {
  const onChangeText = jest.fn();
  const onQrCodeClick = jest.fn();

  render(
    <ContactsAddAddressEntryView
      addressEntry={addressEntry}
      labels={labels}
      {...insets}
      onChangeText={onChangeText}
      onQrCodeClick={onQrCodeClick}
    />,
  );

  return { onChangeText, onQrCodeClick };
}

describe("ContactsAddAddressEntryView", () => {
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

  it("should keep 32 points above the largest visible-area inset", () => {
    renderEntry(
      {
        status: "empty",
        value: "",
        resolvedAddress: null,
        inputMethod: null,
      },
      { bottomInset: 34, keyboardInset: 300 },
    );

    expect(screen.getByTestId("contacts-add-address-entry-screen")).toHaveStyle({
      paddingBottom: 332,
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
    renderEntry({
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
  });

  it.each([
    ["invalid_format", "Invalid address"],
    ["domain_not_found", "No address found for this domain"],
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
