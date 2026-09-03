import { ContactAddressValueSchema } from "@domain/entity-contact";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { isPrefillAddAddressFlowOpen } from "./isPrefillAddAddressFlowOpen";
import type { AddAddressFlowState } from "./state/types";

const ETHEREUM_CURRENCY_ID = getCryptoCurrencyById("ethereum").id;
const RAW_ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const VALID_ADDRESS = ContactAddressValueSchema.parse(RAW_ADDRESS);
const contact = mockContact();

const prefilledNamingState = {
  status: "namingAddress",
  selectedContactId: contact.id,
  existingAddressLabels: [],
  selectedCurrencyId: ETHEREUM_CURRENCY_ID,
  entryMode: "prefilled",
  displayContext: {
    assetDisplayName: "Ethereum",
    network: { networkId: "ethereum", displayName: "Ethereum" },
  },
  addressEntry: {
    status: "valid",
    value: RAW_ADDRESS,
    resolvedAddress: VALID_ADDRESS,
    inputMethod: "manual",
  },
  addressLabel: {
    status: "valid",
    value: "Ethereum",
    label: "Ethereum" as never,
    validationError: null,
  },
} as const satisfies AddAddressFlowState;

describe("isPrefillAddAddressFlowOpen", () => {
  it("should return true for a prefilled naming state", () => {
    expect(isPrefillAddAddressFlowOpen(prefilledNamingState)).toBe(true);
  });

  it("should return true for a prefilled reviewing state", () => {
    expect(
      isPrefillAddAddressFlowOpen({
        ...prefilledNamingState,
        status: "reviewingAddress",
        origin: "addressName",
      }),
    ).toBe(true);
  });

  it("should return false when the flow is closed", () => {
    expect(isPrefillAddAddressFlowOpen({ status: "closed" })).toBe(false);
  });

  it("should return false for a MAD naming state", () => {
    expect(
      isPrefillAddAddressFlowOpen({
        ...prefilledNamingState,
        entryMode: "mad",
      }),
    ).toBe(false);
  });
});
