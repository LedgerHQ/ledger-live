import { isValidContactName } from "@domain/entity-contact";
import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { addressesMatch } from "@ledgerhq/live-common/flows/send/recipient/utils/addressesMatch";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";

export type RecipientInputMethod = "manual" | "paste" | "qr_code";
export type RecipientQueryType = "address" | "ens" | "contact name" | "unrecognised";
export type RecipientResultType =
  | "contact name match"
  | "contact address match"
  | "my account"
  | "unknown address"
  | "no result";
export type RecipientType = "contact" | "my account" | "external address";

type RecipientResolution = Readonly<{
  queryType: RecipientQueryType;
  resultType: RecipientResultType;
  recipientType: RecipientType;
  addressAlreadyUsed: boolean;
}>;

export function getSendFlowTrackingPage(
  currentStep: SendFlowStep,
  isSelectingContactAddress = false,
): string {
  if (isSelectingContactAddress) return "select contact address";

  switch (currentStep) {
    case SEND_FLOW_STEP.ADD_CONTACT:
      return "add contact options";
    case SEND_FLOW_STEP.ADD_NEW_CONTACT:
      return "add contact";
    case SEND_FLOW_STEP.ADD_TO_EXISTING_CONTACT:
      return "select existing contact";
    case SEND_FLOW_STEP.CONFIRMATION:
      return "step confirmation";
    case SEND_FLOW_STEP.SIGNATURE:
      return "step device review";
    default:
      return `step ${currentStep.toLowerCase().replaceAll("_", " ")}`;
  }
}

function getQueryType(
  searchValue: string,
  result: AddressSearchResult,
  hasContactMatch: boolean,
  isContactAddressMatch: boolean,
): RecipientQueryType {
  if (result.ensName) return "ens";
  if (isContactAddressMatch) return "address";
  if (hasContactMatch) return "contact name";
  if (result.status === "valid") return "address";
  return isValidContactName(searchValue) ? "contact name" : "unrecognised";
}

function getResultType(
  result: AddressSearchResult,
  hasContactMatch: boolean,
  isContactAddressMatch: boolean,
): RecipientResultType {
  if (hasContactMatch) {
    return isContactAddressMatch ? "contact address match" : "contact name match";
  }
  if (result.isLedgerAccount || result.matchedAccounts.length > 0) return "my account";
  if (result.status === "valid" || result.status === "ens_resolved") return "unknown address";
  return "no result";
}

function getRecipientType(resultType: RecipientResultType): RecipientType {
  if (resultType === "my account") return "my account";
  if (resultType.startsWith("contact")) return "contact";
  return "external address";
}

export function getRecipientResolution(
  searchValue: string,
  result: AddressSearchResult,
  hasContactNameResult = false,
): RecipientResolution {
  const isContactNameMatch =
    hasContactNameResult ||
    Boolean(
      result.matchedContact &&
      searchValue.trim().toLowerCase() === result.matchedContact.contactName.trim().toLowerCase(),
    );
  const effectiveRecipientAddress = result.resolvedAddress ?? searchValue;
  const isContactAddressMatch = Boolean(
    result.matchedContact &&
    !isContactNameMatch &&
    addressesMatch(effectiveRecipientAddress, result.matchedContact.address),
  );
  const hasContactMatch = isContactNameMatch || Boolean(result.matchedContact);
  const queryType = getQueryType(searchValue, result, hasContactMatch, isContactAddressMatch);
  const resultType = getResultType(result, hasContactMatch, isContactAddressMatch);
  const recipientType = getRecipientType(resultType);

  return {
    queryType,
    resultType,
    recipientType,
    addressAlreadyUsed: Boolean(result.matchedRecentAddress),
  };
}
