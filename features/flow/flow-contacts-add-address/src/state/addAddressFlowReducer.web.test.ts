import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  ContactAddressValueSchema,
  type Contact,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  createValidatingAddressEntryState,
  EMPTY_ADDRESS_ENTRY_STATE,
} from "@features/platform-contacts";
import {
  addAddressFlowReducer,
  CLOSED_ADD_ADDRESS_FLOW_STATE,
  type AddAddressFlowAction,
} from "./addAddressFlowReducer";
import type { AddAddressFlowState, ValidAddAddressEntryState } from "./types";

const ETHEREUM_CURRENCY_ID = getCryptoCurrencyById("ethereum").id;
const BITCOIN_CURRENCY_ID = getCryptoCurrencyById("bitcoin").id;
const ETHEREUM_SELECTION = {
  currencyId: ETHEREUM_CURRENCY_ID,
  assetDisplayName: "Ethereum",
} as const;
const BITCOIN_SELECTION = {
  currencyId: BITCOIN_CURRENCY_ID,
  assetDisplayName: "Bitcoin",
} as const;
const ETHEREUM_NETWORK = { networkId: "ethereum", displayName: "Ethereum" } as const;
const RAW_ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const VALID_ADDRESS_ENTRY: ValidAddAddressEntryState = {
  status: "valid",
  value: RAW_ADDRESS,
  resolvedAddress: ContactAddressValueSchema.parse(RAW_ADDRESS),
  inputMethod: "manual",
};

function reduce(
  actions: readonly AddAddressFlowAction[],
  initialState: AddAddressFlowState = CLOSED_ADD_ADDRESS_FLOW_STATE,
): AddAddressFlowState {
  return actions.reduce(addAddressFlowReducer, initialState);
}

function enteringAddressActions(contact: Contact): AddAddressFlowAction[] {
  return [
    { type: "start", contact },
    { type: "completeCurrencySelection", contactId: contact.id, selection: ETHEREUM_SELECTION },
  ];
}

function namingAddressActions(contact: Contact): AddAddressFlowAction[] {
  return [
    ...enteringAddressActions(contact),
    {
      type: "updateAddressEntry",
      selectedCurrencyId: ETHEREUM_CURRENCY_ID,
      addressEntry: VALID_ADDRESS_ENTRY,
    },
    { type: "confirmAddress" },
  ];
}

function prefilledActions(contact: Contact): AddAddressFlowAction[] {
  return [
    {
      type: "startWithPrefilled",
      params: {
        contact,
        address: RAW_ADDRESS,
        currency: ETHEREUM_SELECTION,
        network: ETHEREUM_NETWORK,
      },
      addressEntry: VALID_ADDRESS_ENTRY,
    },
  ];
}

describe("addAddressFlowReducer", () => {
  describe("start", () => {
    it("should select a currency for the started contact", () => {
      const contact = mockContact({ addresses: [mockContactAddress({ label: "Savings" })] });

      expect(reduce([{ type: "start", contact }])).toEqual({
        status: "selectingCurrency",
        selectedContactId: contact.id,
        existingAddressLabels: ["Savings"],
      });
    });

    it("should discard the previous session when restarted", () => {
      const firstContact = mockMeContact({ addresses: [] });
      const nextContact = mockContact({ addresses: [] });

      expect(
        reduce([...enteringAddressActions(firstContact), { type: "start", contact: nextContact }]),
      ).toEqual({
        status: "selectingCurrency",
        selectedContactId: nextContact.id,
        existingAddressLabels: [],
      });
    });
  });

  describe("startWithPrefilled", () => {
    it("should open the naming step with the prefilled session", () => {
      const contact = mockContact({ addresses: [] });

      expect(reduce(prefilledActions(contact))).toEqual({
        status: "namingAddress",
        selectedContactId: contact.id,
        existingAddressLabels: [],
        selectedCurrencyId: ETHEREUM_CURRENCY_ID,
        entryMode: "prefilled",
        displayContext: { assetDisplayName: "Ethereum", network: ETHEREUM_NETWORK },
        addressEntry: VALID_ADDRESS_ENTRY,
        addressLabel: {
          status: "valid",
          value: "Ethereum",
          label: "Ethereum",
          validationError: null,
        },
      });
    });
  });

  describe("completeCurrencySelection", () => {
    it("should enter the address with a default label for the selected asset", () => {
      const contact = mockContact({ addresses: [] });

      expect(reduce(enteringAddressActions(contact))).toEqual({
        status: "enteringAddress",
        selectedContactId: contact.id,
        existingAddressLabels: [],
        selectedCurrencyId: ETHEREUM_CURRENCY_ID,
        entryMode: "mad",
        displayContext: null,
        addressEntry: EMPTY_ADDRESS_ENTRY_STATE,
        addressLabel: {
          status: "valid",
          value: "Ethereum",
          label: "Ethereum",
          validationError: null,
        },
      });
    });

    it("should limit the default label length", () => {
      const contact = mockContact({ addresses: [] });
      const longLabel = "A".repeat(CONTACT_ADDRESS_LABEL_MAX_LENGTH + 1);

      expect(
        reduce([
          { type: "start", contact },
          {
            type: "completeCurrencySelection",
            contactId: contact.id,
            selection: { currencyId: ETHEREUM_CURRENCY_ID, assetDisplayName: longLabel },
          },
        ]),
      ).toMatchObject({
        addressLabel: { value: longLabel.slice(0, CONTACT_ADDRESS_LABEL_MAX_LENGTH) },
      });
    });

    it("should ignore a selection for a stale contact", () => {
      const staleContact = mockMeContact({ addresses: [] });
      const contact = mockContact({ addresses: [] });
      const state = reduce([{ type: "start", contact }]);

      expect(
        addAddressFlowReducer(state, {
          type: "completeCurrencySelection",
          contactId: staleContact.id,
          selection: ETHEREUM_SELECTION,
        }),
      ).toBe(state);
    });

    it("should ignore a selection once the flow is closed", () => {
      expect(
        addAddressFlowReducer(CLOSED_ADD_ADDRESS_FLOW_STATE, {
          type: "completeCurrencySelection",
          contactId: mockContact().id,
          selection: ETHEREUM_SELECTION,
        }),
      ).toBe(CLOSED_ADD_ADDRESS_FLOW_STATE);
    });
  });

  describe("updateAddressEntry", () => {
    it("should update the entry for the current currency only", () => {
      const state = reduce(enteringAddressActions(mockContact({ addresses: [] })));

      expect(
        addAddressFlowReducer(state, {
          type: "updateAddressEntry",
          selectedCurrencyId: BITCOIN_CURRENCY_ID,
          addressEntry: VALID_ADDRESS_ENTRY,
        }),
      ).toBe(state);
      expect(
        addAddressFlowReducer(state, {
          type: "updateAddressEntry",
          selectedCurrencyId: ETHEREUM_CURRENCY_ID,
          addressEntry: VALID_ADDRESS_ENTRY,
        }),
      ).toEqual({ ...state, addressEntry: VALID_ADDRESS_ENTRY });
    });

    it("should ignore a result whose value no longer matches the entry", () => {
      const state = reduce([
        ...enteringAddressActions(mockContact({ addresses: [] })),
        {
          type: "updateAddressEntry",
          selectedCurrencyId: ETHEREUM_CURRENCY_ID,
          addressEntry: createValidatingAddressEntryState("newer", "manual"),
        },
      ]);

      expect(
        addAddressFlowReducer(state, {
          type: "updateAddressEntry",
          selectedCurrencyId: ETHEREUM_CURRENCY_ID,
          addressEntry: VALID_ADDRESS_ENTRY,
          expectedValue: RAW_ADDRESS,
        }),
      ).toBe(state);
    });
  });

  describe("updateAddressLabel", () => {
    it("should accept a custom label", () => {
      const contact = mockContact({ addresses: [] });

      expect(
        reduce([
          ...namingAddressActions(contact),
          { type: "updateAddressLabel", value: "Exchange" },
        ]),
      ).toMatchObject({
        status: "namingAddress",
        addressLabel: {
          status: "valid",
          value: "Exchange",
          label: "Exchange",
          validationError: null,
        },
      });
    });

    it("should limit an edited label length", () => {
      const contact = mockContact({ addresses: [] });
      const longLabel = "B".repeat(CONTACT_ADDRESS_LABEL_MAX_LENGTH + 1);

      expect(
        reduce([
          ...namingAddressActions(contact),
          { type: "updateAddressLabel", value: longLabel },
        ]),
      ).toMatchObject({
        addressLabel: {
          status: "valid",
          value: longLabel.slice(0, CONTACT_ADDRESS_LABEL_MAX_LENGTH),
        },
      });
    });

    it("should expose invalid characters", () => {
      const contact = mockContact({ addresses: [] });

      expect(
        reduce([...namingAddressActions(contact), { type: "updateAddressLabel", value: "Ethér" }]),
      ).toMatchObject({
        addressLabel: {
          status: "invalid",
          value: "Ethér",
          label: null,
          validationError: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
        },
      });
    });

    it("should keep a blank draft free of errors", () => {
      const contact = mockContact({ addresses: [] });

      expect(
        reduce([...namingAddressActions(contact), { type: "updateAddressLabel", value: "   " }]),
      ).toMatchObject({
        addressLabel: { status: "empty", value: "   ", label: null, validationError: null },
      });
    });

    it("should reject a label already used by the selected contact", () => {
      const contact = mockContact({ addresses: [mockContactAddress({ label: "Ethereum" })] });

      expect(reduce(namingAddressActions(contact))).toMatchObject({
        addressLabel: {
          status: "invalid",
          value: "Ethereum",
          label: null,
          validationError: DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
        },
      });
    });

    it("should ignore label updates outside the entry and naming steps", () => {
      const state = reduce([{ type: "start", contact: mockContact({ addresses: [] }) }]);

      expect(addAddressFlowReducer(state, { type: "updateAddressLabel", value: "Exchange" })).toBe(
        state,
      );
    });
  });

  describe("confirmAddress", () => {
    it("should not confirm an address that is not valid", () => {
      const state = reduce(enteringAddressActions(mockContact({ addresses: [] })));

      expect(addAddressFlowReducer(state, { type: "confirmAddress" })).toBe(state);
    });

    it("should keep the session when moving to naming", () => {
      const contact = mockContact({ addresses: [] });

      expect(reduce(namingAddressActions(contact))).toMatchObject({
        status: "namingAddress",
        selectedContactId: contact.id,
        selectedCurrencyId: ETHEREUM_CURRENCY_ID,
        entryMode: "mad",
        addressEntry: VALID_ADDRESS_ENTRY,
      });
    });
  });

  describe("continueFromAddressDetails", () => {
    it("should review when both address and label are valid", () => {
      const contact = mockContact({ addresses: [] });

      expect(
        reduce([
          ...enteringAddressActions(contact),
          {
            type: "updateAddressEntry",
            selectedCurrencyId: ETHEREUM_CURRENCY_ID,
            addressEntry: VALID_ADDRESS_ENTRY,
          },
          { type: "continueFromAddressDetails" },
        ]),
      ).toMatchObject({ status: "reviewingAddress", origin: "addressDetails" });
    });

    it("should stay on address details when the label is invalid", () => {
      const contact = mockContact({ addresses: [] });
      const state = reduce([
        ...enteringAddressActions(contact),
        { type: "updateAddressLabel", value: "Ethereum 💎" },
        {
          type: "updateAddressEntry",
          selectedCurrencyId: ETHEREUM_CURRENCY_ID,
          addressEntry: VALID_ADDRESS_ENTRY,
        },
      ]);

      expect(addAddressFlowReducer(state, { type: "continueFromAddressDetails" })).toBe(state);
    });
  });

  describe("continueFromName", () => {
    it("should require confirmation for the MAD entry mode", () => {
      const contact = mockContact({ addresses: [] });

      expect(
        reduce([...namingAddressActions(contact), { type: "continueFromName" }]),
      ).toMatchObject({ status: "confirmationRequired", entryMode: "mad" });
    });

    it("should review a prefilled address", () => {
      const contact = mockContact({ addresses: [] });

      expect(reduce([...prefilledActions(contact), { type: "continueFromName" }])).toMatchObject({
        status: "reviewingAddress",
        origin: "addressName",
        entryMode: "prefilled",
      });
    });

    it("should stay on naming when the label is not valid", () => {
      const contact = mockContact({ addresses: [] });
      const state = reduce([
        ...namingAddressActions(contact),
        { type: "updateAddressLabel", value: "" },
      ]);

      expect(addAddressFlowReducer(state, { type: "continueFromName" })).toBe(state);
    });
  });

  describe("success", () => {
    it("should succeed from review without the review origin", () => {
      const contact = mockContact({ addresses: [] });
      const state = reduce([
        ...prefilledActions(contact),
        { type: "continueFromName" },
        { type: "continueFromReview" },
      ]);

      expect(state).toMatchObject({ status: "success", addressEntry: VALID_ADDRESS_ENTRY });
      expect(state).not.toHaveProperty("origin");
    });

    it("should succeed from confirmation with the contact detail target", () => {
      const contact = mockContact({ addresses: [] });

      expect(
        reduce([
          ...namingAddressActions(contact),
          { type: "continueFromName" },
          { type: "completeConfirmation" },
        ]),
      ).toMatchObject({
        status: "success",
        target: { type: "contactDetail", contactId: contact.id },
      });
    });
  });

  describe("goBack", () => {
    it("should navigate back through the MAD flow", () => {
      const contact = mockContact({ addresses: [] });
      let state = reduce([...namingAddressActions(contact), { type: "continueFromName" }]);

      state = addAddressFlowReducer(state, { type: "goBack" });
      expect(state.status).toBe("namingAddress");
      state = addAddressFlowReducer(state, { type: "goBack" });
      expect(state.status).toBe("enteringAddress");
      state = addAddressFlowReducer(state, { type: "goBack" });
      expect(state).toEqual({
        status: "selectingCurrency",
        selectedContactId: contact.id,
        existingAddressLabels: [],
      });
      state = addAddressFlowReducer(state, { type: "goBack" });
      expect(state).toEqual(CLOSED_ADD_ADDRESS_FLOW_STATE);
    });

    it("should return from review to the step it came from", () => {
      const contact = mockContact({ addresses: [] });

      expect(
        reduce([
          ...enteringAddressActions(contact),
          {
            type: "updateAddressEntry",
            selectedCurrencyId: ETHEREUM_CURRENCY_ID,
            addressEntry: VALID_ADDRESS_ENTRY,
          },
          { type: "continueFromAddressDetails" },
          { type: "goBack" },
        ]),
      ).toMatchObject({ status: "enteringAddress", addressEntry: VALID_ADDRESS_ENTRY });
      expect(
        reduce([...prefilledActions(contact), { type: "continueFromName" }, { type: "goBack" }]),
      ).toMatchObject({ status: "namingAddress", entryMode: "prefilled" });
    });

    it("should close a prefilled flow from naming", () => {
      expect(
        reduce([...prefilledActions(mockContact({ addresses: [] })), { type: "goBack" }]),
      ).toBe(CLOSED_ADD_ADDRESS_FLOW_STATE);
    });

    it("should reset a custom label after the selected asset changes", () => {
      const contact = mockContact({ addresses: [] });

      expect(
        reduce([
          ...namingAddressActions(contact),
          { type: "updateAddressLabel", value: "Exchange" },
          { type: "goBack" },
          { type: "goBack" },
          {
            type: "completeCurrencySelection",
            contactId: contact.id,
            selection: BITCOIN_SELECTION,
          },
        ]),
      ).toMatchObject({
        status: "enteringAddress",
        selectedCurrencyId: BITCOIN_CURRENCY_ID,
        addressLabel: { status: "valid", value: "Bitcoin", label: "Bitcoin" },
      });
    });

    it("should keep closed and success states unchanged", () => {
      const success = reduce([
        ...namingAddressActions(mockContact({ addresses: [] })),
        { type: "continueFromName" },
        { type: "completeConfirmation" },
      ]);

      expect(addAddressFlowReducer(CLOSED_ADD_ADDRESS_FLOW_STATE, { type: "goBack" })).toBe(
        CLOSED_ADD_ADDRESS_FLOW_STATE,
      );
      expect(addAddressFlowReducer(success, { type: "goBack" })).toBe(success);
    });
  });

  describe("close", () => {
    it("should close from any step", () => {
      const state = reduce(namingAddressActions(mockContact({ addresses: [] })));

      expect(addAddressFlowReducer(state, { type: "close" })).toBe(CLOSED_ADD_ADDRESS_FLOW_STATE);
    });
  });
});
