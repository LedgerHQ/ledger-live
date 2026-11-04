import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
  type ContactAddress,
  type ContactId,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { AddAddressFlowState } from "../../state/types";
import {
  resolveAddAddressWebFlowStep,
  shouldUseAddAddressFlowBackNavigation,
  type AddAddressWebFlowStep,
} from "./addAddressWebFlowStep";
import { ContactsAddAddressFlowContent } from "./ContactsAddAddressFlowContent";
import type { ContactsAddAddressFlowContentProps } from "./ContactsAddAddressFlowContent.types";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const lumen = jest.requireActual("@ledgerhq/lumen-ui-react");
  function AddressInput({
    onQrCodeClick,
    ...props
  }: Readonly<{ onQrCodeClick?: () => void }>): React.JSX.Element {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(lumen.AddressInput, props),
      onQrCodeClick
        ? React.createElement("button", {
            type: "button",
            "aria-label": "Scan QR code",
            onClick: onQrCodeClick,
          })
        : null,
    );
  }
  return new Proxy(lumen, {
    get: (target, prop) => (prop === "AddressInput" ? AddressInput : target[prop]),
  });
});

type OpenAddAddressFlowState = Exclude<AddAddressFlowState, { status: "closed" }>;

function createState(status: OpenAddAddressFlowState["status"]): OpenAddAddressFlowState {
  return { status } as OpenAddAddressFlowState;
}

const address = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
const label = ContactAddressLabelSchema.parse("Ethereum");

function createContentState(
  status: ContactsAddAddressFlowContentProps["state"]["status"],
): ContactsAddAddressFlowContentProps["state"] {
  const session = {
    selectedContactId: "contact" as ContactId,
    existingAddressLabels: [],
    selectedCurrencyId: "ethereum" as ContactAddress["currencyId"],
    entryMode: "mad" as const,
    displayContext: null,
    addressEntry: {
      status: "valid" as const,
      value: address,
      resolvedAddress: address,
      inputMethod: "manual" as const,
    },
    addressLabel: {
      status: "valid" as const,
      value: label,
      label,
      validationError: null,
    },
  };

  return {
    ...session,
    status,
    ...(status === "reviewingAddress" ? { origin: "addressDetails" as const } : {}),
  } as ContactsAddAddressFlowContentProps["state"];
}

function createContentProps(
  state: ContactsAddAddressFlowContentProps["state"],
): ContactsAddAddressFlowContentProps {
  return {
    state,
    supportsDomain: true,
    onAddressChange: jest.fn(),
    onContinueFromAddressDetails: jest.fn(),
    onAddressLabelChange: jest.fn(),
    onContinueFromName: jest.fn(),
    onContinueFromReview: jest.fn(),
  };
}

describe("ContactsAddAddressFlowContent", () => {
  it.each([
    ["selectingCurrency", "currency", false],
    ["enteringAddress", "address", true],
    ["namingAddress", "name", true],
    ["confirmationRequired", "review", true],
    ["reviewingAddress", "review", true],
    ["success", "success", false],
  ] satisfies ReadonlyArray<
    readonly [OpenAddAddressFlowState["status"], AddAddressWebFlowStep, boolean]
  >)("should resolve the %s state", (status, step, usesFlowBackNavigation) => {
    const state = createState(status);

    expect(resolveAddAddressWebFlowStep(state)).toBe(step);
    expect(shouldUseAddAddressFlowBackNavigation(state)).toBe(usesFlowBackNavigation);
  });

  it("should render each flow content and call its transition", () => {
    const addressProps = createContentProps(createContentState("enteringAddress"));
    const { rerender } = render(<ContactsAddAddressFlowContent {...addressProps} />, {
      wrapper: I18nTestProvider,
    });

    expect(screen.getByTestId("contacts-add-address-input")).toBeInTheDocument();

    const nameProps = createContentProps(createContentState("namingAddress"));
    rerender(<ContactsAddAddressFlowContent {...nameProps} />);

    fireEvent.click(screen.getByTestId("contacts-add-address-name-continue"));
    expect(nameProps.onContinueFromName).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("contacts-add-address-confirmed-input")).toBeInTheDocument();

    const confirmationProps = createContentProps(createContentState("confirmationRequired"));
    rerender(<ContactsAddAddressFlowContent {...confirmationProps} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    const reviewProps = createContentProps(createContentState("reviewingAddress"));
    rerender(<ContactsAddAddressFlowContent {...reviewProps} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    const prefilledReviewState = {
      ...createContentState("reviewingAddress"),
      entryMode: "prefilled" as const,
      displayContext: {
        assetDisplayName: "Ethereum",
        network: {
          networkId: "ethereum",
          displayName: "Ethereum",
        },
      },
      origin: "addressName" as const,
    };
    const prefilledReviewProps = createContentProps(prefilledReviewState);
    rerender(<ContactsAddAddressFlowContent {...prefilledReviewProps} />);

    expect(screen.getByTestId("contacts-add-address-review-address")).toHaveTextContent(address);
    expect(screen.getByTestId("contacts-add-address-review-currency")).toHaveTextContent(
      "Ethereum",
    );
    expect(screen.getByTestId("contacts-add-address-review-network")).toHaveTextContent("Ethereum");
    expect(screen.getByTestId("contacts-add-address-review-name")).toHaveTextContent(label);
    fireEvent.click(screen.getByTestId("contacts-add-address-review-continue"));
    expect(prefilledReviewProps.onContinueFromReview).toHaveBeenCalledTimes(1);

    const successProps = createContentProps(createContentState("success"));
    rerender(<ContactsAddAddressFlowContent {...successProps} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should show the QR code scanner only when the host can scan", () => {
    const withoutScanProps = createContentProps(createContentState("enteringAddress"));
    const { rerender } = render(<ContactsAddAddressFlowContent {...withoutScanProps} />, {
      wrapper: I18nTestProvider,
    });

    expect(screen.queryByRole("button", { name: "Scan QR code" })).not.toBeInTheDocument();

    const onScanQrCode = jest.fn();
    rerender(<ContactsAddAddressFlowContent {...withoutScanProps} onScanQrCode={onScanQrCode} />);

    fireEvent.click(screen.getByRole("button", { name: "Scan QR code" }));
    expect(onScanQrCode).toHaveBeenCalledTimes(1);
  });
});
