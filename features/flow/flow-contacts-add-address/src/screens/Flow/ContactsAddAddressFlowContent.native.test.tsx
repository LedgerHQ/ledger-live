import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import {
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
  type ContactAddress,
  type ContactId,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { AddAddressEntryMode } from "../../state/types";
import { ContactsAddAddressFlowContent } from "./ContactsAddAddressFlowContent";
import type {
  AddAddressFlowContentState,
  ContactsAddAddressFlowContentProps,
} from "./ContactsAddAddressFlowContent.types";

jest.mock("@shared/linking", () => ({
  useOpenLink: () => jest.fn(),
  useLocalizedUrl: (url: string) => url,
}));

const address = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
const label = ContactAddressLabelSchema.parse("Ethereum");

function createState(
  status: AddAddressFlowContentState["status"],
  entryMode: AddAddressEntryMode = "mad",
): AddAddressFlowContentState {
  return {
    status,
    selectedContactId: "contact" as ContactId,
    existingAddressLabels: [],
    selectedCurrencyId: "ethereum" as ContactAddress["currencyId"],
    entryMode,
    displayContext:
      entryMode === "prefilled"
        ? {
            assetDisplayName: "Ether",
            network: { networkId: "ethereum", displayName: "Ethereum" },
          }
        : null,
    addressEntry: {
      status: "valid",
      value: address,
      resolvedAddress: address,
      inputMethod: "manual",
    },
    addressLabel: {
      status: "valid",
      value: label,
      label,
      validationError: null,
    },
    ...(status === "reviewingAddress" ? { origin: "addressName" } : {}),
  } as AddAddressFlowContentState;
}

function renderContent(
  state: AddAddressFlowContentState,
  overrides: Partial<ContactsAddAddressFlowContentProps> = {},
) {
  const props = {
    state,
    supportsDomain: true,
    onAddressChange: jest.fn(),
    onScanQrCode: jest.fn(),
    onContinueFromAddressDetails: jest.fn(),
    onAddressLabelChange: jest.fn(),
    onContinueFromName: jest.fn(),
    onContinueFromReview: jest.fn(),
    ...overrides,
  } satisfies ContactsAddAddressFlowContentProps;

  render(<ContactsAddAddressFlowContent {...props} />, { wrapper: I18nTestProvider });

  return props;
}

describe("ContactsAddAddressFlowContent", () => {
  it("should render the address step while entering the address", () => {
    const props = renderContent(createState("enteringAddress"));

    expect(screen.getByTestId("contacts-add-address-step-frame")).toHaveStyle({ height: "100%" });
    expect(screen.getByTestId("contacts-add-address-entry-screen")).toBeVisible();

    fireEvent.changeText(screen.getByTestId("contacts-add-address-input"), "0");
    fireEvent.press(screen.getByTestId("contacts-add-address-confirm"));

    expect(props.onAddressChange).toHaveBeenCalledWith("0", "manual");
    expect(props.onContinueFromAddressDetails).toHaveBeenCalledTimes(1);
  });

  it("should scan a QR code from the address step", () => {
    const props = renderContent(createState("enteringAddress"));

    fireEvent(screen.getByTestId("contacts-add-address-input"), "qrCodeClick");

    expect(props.onScanQrCode).toHaveBeenCalledTimes(1);
  });

  it.each(["namingAddress", "confirmationRequired"] as const)(
    "should render the name step in the %s state",
    status => {
      const props = renderContent(createState(status));

      expect(screen.getByTestId("contacts-add-address-step-frame")).toBeVisible();
      expect(screen.getByTestId("contacts-add-address-name-screen")).toBeVisible();

      fireEvent.changeText(screen.getByTestId("contacts-add-address-name-input"), "Exchange");
      fireEvent.press(screen.getByTestId("contacts-add-address-name-continue"));

      expect(props.onAddressLabelChange).toHaveBeenCalledWith("Exchange");
      expect(props.onContinueFromName).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ["mad", "common.continue"],
    ["prefilled", "contacts.addAddressName.continueToReview"],
  ] as const)("should continue the %s entry mode with %s", (entryMode, continueLabel) => {
    renderContent(createState("namingAddress", entryMode));

    expect(screen.getByTestId("contacts-add-address-name-continue")).toHaveTextContent(
      continueLabel,
    );
  });

  it("should render the review step for a prefilled address", () => {
    const props = renderContent(createState("reviewingAddress", "prefilled"));

    expect(screen.getByTestId("contacts-add-address-step-frame")).toBeVisible();
    expect(
      within(screen.getByTestId("contacts-add-address-review-address")).getByText(address),
    ).toBeVisible();
    expect(
      within(screen.getByTestId("contacts-add-address-review-currency")).getByText("Ether"),
    ).toBeVisible();
    expect(
      within(screen.getByTestId("contacts-add-address-review-network")).getByText("Ethereum"),
    ).toBeVisible();
    expect(
      within(screen.getByTestId("contacts-add-address-review-name")).getByText(label),
    ).toBeVisible();

    fireEvent.press(screen.getByTestId("contacts-add-address-review-continue"));

    expect(props.onContinueFromReview).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["reviewingAddress", "mad"],
    ["success", "mad"],
    ["success", "prefilled"],
  ] as const)("should render nothing in the %s state of the %s entry mode", (status, entryMode) => {
    renderContent(createState(status, entryMode));

    expect(screen.queryByTestId("contacts-add-address-step-frame")).toBeNull();
  });

  it.each([
    ["enteringAddress", "mad", "contacts-add-address-entry-screen", 320],
    ["namingAddress", "mad", "contacts-add-address-name-screen", 320],
    ["reviewingAddress", "prefilled", "contacts-add-address-review", 352],
  ] as const)(
    "should keep the %s step above the keyboard inset",
    (status, entryMode, screenTestId, paddingBottom) => {
      renderContent(createState(status, entryMode), { bottomOffset: 320 });

      expect(screen.getByTestId(screenTestId)).toHaveStyle({ paddingBottom });
    },
  );
});
