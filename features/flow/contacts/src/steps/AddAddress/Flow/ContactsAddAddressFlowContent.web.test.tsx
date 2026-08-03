import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
  type ContactAddress,
  type ContactAddressLabelValidationErrorName,
  type ContactId,
} from "@domain/entity-contact";
import type {
  AddAddressCompletionLabels,
  AddAddressEntryLabels,
  AddAddressFlowState,
} from "../types";
import {
  ContactsAddAddressFlowContent,
  type ContactsAddAddressFlowContentProps,
  resolveAddAddressWebFlowStep,
  shouldUseAddAddressFlowBackNavigation,
  type AddAddressWebFlowStep,
} from "./ContactsAddAddressFlowContent.web";
import type { ContactsAddAddressNameLabels } from "../AddressName/types";

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
  continueToReview: "Continue to review",
  validAddress: "Valid address",
  validationErrors: {} as Record<ContactAddressLabelValidationErrorName, string>,
};
const completionLabels: AddAddressCompletionLabels = {
  title: "Review address",
  continue: "Continue",
  successTitle: "Address added",
  close: "Close",
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
    completionLabels,
    onAddressChange: jest.fn(),
    onContinueFromAddressDetails: jest.fn(),
    onAddressLabelChange: jest.fn(),
    onContinueFromName: jest.fn(),
    onContinueFromReview: jest.fn(),
    onClose: jest.fn(),
  };
}

describe("ContactsAddAddressFlowContent", () => {
  it.each([
    ["selectingCurrency", "currency", false],
    ["enteringAddress", "address", true],
    ["namingAddress", "name", true],
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

    const reviewProps = createContentProps(createContentState("reviewingAddress"));
    rerender(<ContactsAddAddressFlowContent {...reviewProps} />);

    fireEvent.click(screen.getByTestId("contacts-add-address-review-continue"));
    expect(reviewProps.onContinueFromReview).toHaveBeenCalledTimes(1);

    const successProps = createContentProps(createContentState("success"));
    rerender(<ContactsAddAddressFlowContent {...successProps} />);

    fireEvent.click(screen.getByTestId("contacts-add-address-success-continue"));
    expect(successProps.onClose).toHaveBeenCalledTimes(1);
  });
});
