import { act, renderHook } from "@testing-library/react";
import {
  ContactAddressValueSchema,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "./model/constants";
import type { ContactsAddressValidationPort, ContactsAddressValidationResult } from "./model/ports";
import { useAddAddressFlowViewModel } from "./useAddAddressFlowViewModel";

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
const RAW_ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const VALID_ADDRESS = ContactAddressValueSchema.parse(RAW_ADDRESS);
const RESOLVED_ADDRESS = ContactAddressValueSchema.parse(
  "0x2ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
);

function createValidationPort(
  result: ContactsAddressValidationResult = {
    status: "valid",
    resolvedAddress: VALID_ADDRESS,
    isDomain: false,
  },
): ContactsAddressValidationPort & {
  validateAddress: jest.MockedFunction<ContactsAddressValidationPort["validateAddress"]>;
} {
  return {
    validateAddress: jest.fn().mockResolvedValue(result),
  };
}

function createDeferredValidation() {
  let resolve: (result: ContactsAddressValidationResult) => void = () => undefined;
  const promise = new Promise<ContactsAddressValidationResult>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function contactWithoutAddresses(contactId: ReturnType<typeof mockContact>["id"]) {
  return { id: contactId, addresses: [] };
}

describe("useAddAddressFlowViewModel", () => {
  it("should be closed initially", () => {
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    expect(result.current.state).toEqual({ status: "closed" });
  });

  it("should start currency selection for Me", () => {
    const contactId = mockMeContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactWithoutAddresses(contactId)));

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: contactId,
      existingAddressLabels: [],
    });
  });

  it("should replace the selected contact when restarted", () => {
    const firstContactId = mockMeContact().id;
    const nextContactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactWithoutAddresses(firstContactId)));
    act(() => result.current.start(contactWithoutAddresses(nextContactId)));

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: nextContactId,
      existingAddressLabels: [],
    });
  });

  it("should continue to address entry with the selected contact and currency", () => {
    const contactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));

    expect(result.current.state).toEqual({
      status: "enteringAddress",
      selectedContactId: contactId,
      existingAddressLabels: [],
      selectedCurrencyId: ETHEREUM_CURRENCY_ID,
      addressEntry: {
        status: "empty",
        value: "",
        resolvedAddress: null,
        inputMethod: null,
      },
      addressLabel: {
        status: "valid",
        value: "Ethereum",
        label: "Ethereum",
        validationError: null,
      },
    });
  });

  it("should ignore a currency selected for a stale contact session", () => {
    const firstContactId = mockMeContact().id;
    const nextContactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactWithoutAddresses(firstContactId)));
    act(() => result.current.start(contactWithoutAddresses(nextContactId)));
    act(() => result.current.completeCurrencySelection(firstContactId, ETHEREUM_SELECTION));

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: nextContactId,
      existingAddressLabels: [],
    });
  });

  it("should clear a previously selected currency when restarted", () => {
    const firstContactId = mockMeContact().id;
    const nextContactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactWithoutAddresses(firstContactId)));
    act(() => result.current.completeCurrencySelection(firstContactId, ETHEREUM_SELECTION));
    act(() => result.current.start(contactWithoutAddresses(nextContactId)));

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: nextContactId,
      existingAddressLabels: [],
    });
  });

  it("should ignore currency completion after the flow is closed", () => {
    const contactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.close());
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));

    expect(result.current.state).toEqual({ status: "closed" });
  });

  it("should return to currency selection from address entry", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.goBack());

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: contactId,
      existingAddressLabels: [],
    });
  });

  it("should remain closed when closed repeatedly", () => {
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(mockContact()));
    act(() => result.current.close());
    act(() => result.current.close());

    expect(result.current.state).toEqual({ status: "closed" });
  });

  it.each(["manual", "paste", "qr_code"] as const)(
    "should retain the %s input method for a valid address",
    async inputMethod => {
      const contactId = mockContact().id;
      const addressValidation = createValidationPort();
      const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

      act(() => result.current.start(contactWithoutAddresses(contactId)));
      act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
      await act(() => result.current.updateAddress(RAW_ADDRESS, inputMethod));

      expect(addressValidation.validateAddress).toHaveBeenCalledWith({
        currencyId: ETHEREUM_CURRENCY_ID,
        address: RAW_ADDRESS,
      });
      expect(result.current.state).toMatchObject({
        status: "enteringAddress",
        addressEntry: {
          status: "valid",
          value: RAW_ADDRESS,
          resolvedAddress: RAW_ADDRESS,
          inputMethod,
        },
      });
    },
  );

  it("should store a resolved address and mark an ENS input", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort({
      status: "valid",
      resolvedAddress: RESOLVED_ADDRESS,
      isDomain: true,
    });
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress("ledger.eth", "manual"));

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: {
        status: "valid",
        value: "ledger.eth",
        resolvedAddress: RESOLVED_ADDRESS,
        inputMethod: "ens",
      },
    });
  });

  it("should advance through the placeholder steps with the resolved address", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort({
      status: "valid",
      resolvedAddress: RESOLVED_ADDRESS,
      isDomain: true,
    });
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress("ledger.eth", "manual"));
    act(() => result.current.confirmAddress());

    expect(result.current.state).toMatchObject({
      status: "namingAddress",
      addressEntry: {
        value: "ledger.eth",
        resolvedAddress: RESOLVED_ADDRESS,
      },
    });

    act(() => result.current.continueFromName());
    expect(result.current.state.status).toBe("reviewingAddress");

    act(() => result.current.continueFromReview());
    expect(result.current.state.status).toBe("success");
  });

  it("should allow a custom address label before review", async () => {
    const contact = mockContact();
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contact));
    act(() => result.current.completeCurrencySelection(contact.id, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.confirmAddress());
    act(() => result.current.updateAddressLabel("Exchange"));

    expect(result.current.state).toMatchObject({
      status: "namingAddress",
      addressLabel: {
        status: "valid",
        value: "Exchange",
        label: "Exchange",
        validationError: null,
      },
    });

    act(() => result.current.continueFromName());
    expect(result.current.state.status).toBe("reviewingAddress");
  });

  it("should limit default and edited address labels to 32 characters", async () => {
    const contact = mockContact();
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));
    const longDefaultLabel = "A".repeat(CONTACT_ADDRESS_LABEL_MAX_LENGTH + 1);
    const longEditedLabel = "B".repeat(CONTACT_ADDRESS_LABEL_MAX_LENGTH + 1);

    act(() => result.current.start(contact));
    act(() =>
      result.current.completeCurrencySelection(contact.id, {
        currencyId: ETHEREUM_CURRENCY_ID,
        assetDisplayName: longDefaultLabel,
      }),
    );

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressLabel: {
        status: "valid",
        value: longDefaultLabel.slice(0, CONTACT_ADDRESS_LABEL_MAX_LENGTH),
      },
    });

    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.confirmAddress());
    act(() => result.current.updateAddressLabel(longEditedLabel));

    expect(result.current.state).toMatchObject({
      status: "namingAddress",
      addressLabel: {
        status: "valid",
        value: longEditedLabel.slice(0, CONTACT_ADDRESS_LABEL_MAX_LENGTH),
      },
    });
  });

  it("should expose invalid characters and prevent review", async () => {
    const contact = mockContact();
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contact));
    act(() => result.current.completeCurrencySelection(contact.id, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.confirmAddress());
    act(() => result.current.updateAddressLabel("Ethér"));

    expect(result.current.state).toMatchObject({
      status: "namingAddress",
      addressLabel: {
        status: "invalid",
        value: "Ethér",
        label: null,
        validationError: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
      },
    });

    act(() => result.current.continueFromName());
    expect(result.current.state.status).toBe("namingAddress");
  });

  it("should keep an empty draft free of errors and prevent review", async () => {
    const contact = mockContact();
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contact));
    act(() => result.current.completeCurrencySelection(contact.id, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.confirmAddress());
    act(() => result.current.updateAddressLabel("   "));

    expect(result.current.state).toMatchObject({
      status: "namingAddress",
      addressLabel: {
        status: "empty",
        value: "   ",
        label: null,
        validationError: null,
      },
    });

    act(() => result.current.continueFromName());
    expect(result.current.state.status).toBe("namingAddress");
  });

  it("should reject an address label already used by the selected contact", async () => {
    const contact = mockContact({
      addresses: [mockContactAddress({ label: "Ethereum" })],
    });
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contact));
    act(() => result.current.completeCurrencySelection(contact.id, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.confirmAddress());

    expect(result.current.state).toMatchObject({
      status: "namingAddress",
      addressLabel: {
        status: "invalid",
        value: "Ethereum",
        label: null,
        validationError: DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
      },
    });
  });

  it("should reset a custom address label after the selected asset changes", async () => {
    const contact = mockContact();
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contact));
    act(() => result.current.completeCurrencySelection(contact.id, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.confirmAddress());
    act(() => result.current.updateAddressLabel("Exchange"));
    act(() => result.current.goBack());
    act(() => result.current.goBack());
    act(() => result.current.completeCurrencySelection(contact.id, BITCOIN_SELECTION));

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      selectedCurrencyId: BITCOIN_CURRENCY_ID,
      addressLabel: {
        status: "valid",
        value: "Bitcoin",
        label: "Bitcoin",
        validationError: null,
      },
    });
  });

  it("should not confirm an invalid address", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort({ status: "invalid_format" });
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress("invalid", "manual"));
    act(() => result.current.confirmAddress());

    expect(result.current.state.status).toBe("enteringAddress");
  });

  it("should navigate back through the composed flow", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.confirmAddress());
    act(() => result.current.continueFromName());

    act(() => result.current.goBack());
    expect(result.current.state.status).toBe("namingAddress");

    act(() => result.current.goBack());
    expect(result.current.state.status).toBe("enteringAddress");

    act(() => result.current.goBack());
    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: contactId,
      existingAddressLabels: [],
    });

    act(() => result.current.goBack());
    expect(result.current.state).toEqual({ status: "closed" });
  });

  it.each([
    ["invalid_format", "manual"],
    ["domain_not_found", "ens"],
  ] as const)("should expose %s as an invalid address", async (error, inputMethod) => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort({ status: error });
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress("invalid", "manual"));

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: {
        status: "invalid",
        value: "invalid",
        resolvedAddress: null,
        inputMethod,
        error,
      },
    });
  });

  it("should prevent confirmation for a sanctioned address", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort({ status: "sanctioned", isDomain: false });
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));
    act(() => result.current.confirmAddress());

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: { status: "invalid", inputMethod: "manual", error: "sanctioned" },
    });
  });

  it("should keep ENS provenance when a resolved domain has an invalid format", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort({
      status: "invalid_format",
      isDomain: true,
    });
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress("ledger.eth", "manual"));

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: {
        status: "invalid",
        value: "ledger.eth",
        resolvedAddress: null,
        inputMethod: "ens",
        error: "invalid_format",
      },
    });
  });

  it("should keep ENS provenance when a resolved domain is sanctioned", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort({ status: "sanctioned", isDomain: true });
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress("ledger.eth", "manual"));

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: {
        status: "invalid",
        value: "ledger.eth",
        resolvedAddress: null,
        inputMethod: "ens",
        error: "sanctioned",
      },
    });
  });

  it("should expose unavailable when no validation adapter is provided", async () => {
    const contactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: {
        status: "unavailable",
        value: RAW_ADDRESS,
        resolvedAddress: null,
        inputMethod: "manual",
      },
    });
  });

  it("should expose unavailable when the validation adapter rejects", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort();
    addressValidation.validateAddress.mockRejectedValue(new Error("validation unavailable"));
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "manual"));

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: { status: "unavailable" },
    });
  });

  it("should expose validating while address validation is pending", async () => {
    const contactId = mockContact().id;
    const deferredValidation = createDeferredValidation();
    const addressValidation = createValidationPort();
    addressValidation.validateAddress.mockReturnValue(deferredValidation.promise);
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));

    let update = Promise.resolve();
    act(() => {
      update = result.current.updateAddress(RAW_ADDRESS, "manual");
    });

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: {
        status: "validating",
        value: RAW_ADDRESS,
        inputMethod: "manual",
      },
    });

    await act(async () => {
      deferredValidation.resolve({
        status: "valid",
        resolvedAddress: VALID_ADDRESS,
        isDomain: false,
      });
      await update;
    });
  });

  it("should debounce manual validation and only validate the latest value", async () => {
    jest.useFakeTimers();
    try {
      const contactId = mockContact().id;
      const addressValidation = createValidationPort();
      const { result } = renderHook(() =>
        useAddAddressFlowViewModel({
          addressValidation,
          manualValidationDebounceMs: 200,
        }),
      );

      act(() => result.current.start(contactWithoutAddresses(contactId)));
      act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));

      let firstUpdate = Promise.resolve();
      let secondUpdate = Promise.resolve();
      act(() => {
        firstUpdate = result.current.updateAddress("first", "manual");
        secondUpdate = result.current.updateAddress("second", "manual");
      });

      expect(addressValidation.validateAddress).not.toHaveBeenCalled();
      expect(result.current.state).toMatchObject({
        status: "enteringAddress",
        addressEntry: { status: "validating", value: "second" },
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(200);
        await Promise.all([firstUpdate, secondUpdate]);
      });

      expect(addressValidation.validateAddress).toHaveBeenCalledTimes(1);
      expect(addressValidation.validateAddress).toHaveBeenCalledWith({
        currencyId: ETHEREUM_CURRENCY_ID,
        address: "second",
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("should validate pasted input without the manual debounce", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort();
    const { result } = renderHook(() =>
      useAddAddressFlowViewModel({
        addressValidation,
        manualValidationDebounceMs: 200,
      }),
    );

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress(RAW_ADDRESS, "paste"));

    expect(addressValidation.validateAddress).toHaveBeenCalledTimes(1);
  });

  it("should reset to empty without validating blank input", async () => {
    const contactId = mockContact().id;
    const addressValidation = createValidationPort();
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));
    await act(() => result.current.updateAddress("   ", "paste"));

    expect(addressValidation.validateAddress).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: {
        status: "empty",
        value: "",
        resolvedAddress: null,
        inputMethod: null,
      },
    });
  });

  it("should ignore an older validation result after the address changes", async () => {
    const contactId = mockContact().id;
    const firstValidation = createDeferredValidation();
    const secondValidation = createDeferredValidation();
    const addressValidation = createValidationPort();
    addressValidation.validateAddress
      .mockReturnValueOnce(firstValidation.promise)
      .mockReturnValueOnce(secondValidation.promise);
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));

    let firstUpdate = Promise.resolve();
    let secondUpdate = Promise.resolve();
    act(() => {
      firstUpdate = result.current.updateAddress("first", "manual");
      secondUpdate = result.current.updateAddress("second", "manual");
    });

    await act(async () => {
      secondValidation.resolve({
        status: "valid",
        resolvedAddress: RESOLVED_ADDRESS,
        isDomain: false,
      });
      await secondUpdate;
    });
    await act(async () => {
      firstValidation.resolve({ status: "invalid_format" });
      await firstUpdate;
    });

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      addressEntry: {
        status: "valid",
        value: "second",
        resolvedAddress: RESOLVED_ADDRESS,
      },
    });
  });

  it("should ignore validation from the previous currency session", async () => {
    const contactId = mockContact().id;
    const deferredValidation = createDeferredValidation();
    const addressValidation = createValidationPort();
    addressValidation.validateAddress.mockReturnValue(deferredValidation.promise);
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));

    let update = Promise.resolve();
    act(() => {
      update = result.current.updateAddress(RAW_ADDRESS, "manual");
    });
    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, BITCOIN_SELECTION));
    await act(async () => {
      deferredValidation.resolve({
        status: "valid",
        resolvedAddress: VALID_ADDRESS,
        isDomain: false,
      });
      await update;
    });

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      selectedCurrencyId: BITCOIN_CURRENCY_ID,
      addressEntry: { status: "empty" },
    });
  });

  it("should keep validating when a stale currency selection completes", async () => {
    const contactId = mockContact().id;
    const staleContactId = mockMeContact().id;
    const deferredValidation = createDeferredValidation();
    const addressValidation = createValidationPort();
    addressValidation.validateAddress.mockReturnValue(deferredValidation.promise);
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));

    let update = Promise.resolve();
    act(() => {
      update = result.current.updateAddress(RAW_ADDRESS, "manual");
    });
    act(() => result.current.completeCurrencySelection(staleContactId, BITCOIN_SELECTION));
    await act(async () => {
      deferredValidation.resolve({
        status: "valid",
        resolvedAddress: VALID_ADDRESS,
        isDomain: false,
      });
      await update;
    });

    expect(result.current.state).toMatchObject({
      status: "enteringAddress",
      selectedCurrencyId: ETHEREUM_CURRENCY_ID,
      addressEntry: {
        status: "valid",
        resolvedAddress: VALID_ADDRESS,
      },
    });
  });

  it("should ignore validation after the flow closes", async () => {
    const contactId = mockContact().id;
    const deferredValidation = createDeferredValidation();
    const addressValidation = createValidationPort();
    addressValidation.validateAddress.mockReturnValue(deferredValidation.promise);
    const { result } = renderHook(() => useAddAddressFlowViewModel({ addressValidation }));

    act(() => result.current.start(contactWithoutAddresses(contactId)));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_SELECTION));

    let update = Promise.resolve();
    act(() => {
      update = result.current.updateAddress(RAW_ADDRESS, "manual");
    });
    act(() => result.current.close());
    await act(async () => {
      deferredValidation.resolve({
        status: "valid",
        resolvedAddress: VALID_ADDRESS,
        isDomain: false,
      });
      await update;
    });

    expect(result.current.state).toEqual({ status: "closed" });
  });
});
