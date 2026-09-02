import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
  type ContactAddress,
  type ContactAddressLabelValidationErrorName,
  type ContactId,
} from "@domain/entity-contact";
import type { AddAddressEntryLabels, AddAddressFlowState } from "../../state/types";
import {
  ContactsAddAddressFlowContent,
  type ContactsAddAddressFlowContentProps,
  resolveAddAddressWebFlowStep,
  shouldUseAddAddressFlowBackNavigation,
  type AddAddressWebFlowStep,
} from "./ContactsAddAddressFlowContent";
import type { ContactsAddAddressNameLabels } from "../AddressName/types";
import type { ContactsAddAddressReviewLabels } from "../Review/types";

type OpenAddAddressFlowState = Exclude<AddAddressFlowState, { status: "closed" }>;

function createState(status: OpenAddAddressFlowState["status"]): OpenAddAddressFlowState {
  return { status } as OpenAddAddressFlowState;
}

const entryLabels: AddAddressEntryLabels = {
  title: "Enter address",
  addressPlaceholder: "Address",
  confirmAddress: "Continue",
  validatingAddress: "Validating address",
  validAddress: "Valid address",
  invalidAddress: "Invalid address",
  domainNotFound: "Domain not found",
  sanctionedAddress: "Address is sanctioned",
  validationUnavailable: "Address validation is unavailable",
  ensDisclaimer: "ENS disclaimer",
};
const nameLabels: ContactsAddAddressNameLabels = {
  inputLabel: "Address name",
  namingDisclaimer: "Address naming disclaimer",
  namingDisclaimerAccessibilityLabel: "Address name information",
  continueToReview: "Continue to review",
  validAddress: "Valid address",
  validationErrors: {} as Record<ContactAddressLabelValidationErrorName, string>,
};
const reviewLabels: ContactsAddAddressReviewLabels = {
  title: "Review address",
  addressLabel: "Address",
  currencyLabel: "Currency",
  networkLabel: "Network",
  nameLabel: "Address name",
  continue: "Confirm address",
};
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
    entryLabels,
    nameLabels,
    reviewLabels,
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
    const { rerender } = render(<ContactsAddAddressFlowContent {...addressProps} />);

    fireEvent.click(screen.getByTestId("contacts-add-address-confirm"));
    expect(addressProps.onContinueFromAddressDetails).toHaveBeenCalledTimes(1);

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
});
