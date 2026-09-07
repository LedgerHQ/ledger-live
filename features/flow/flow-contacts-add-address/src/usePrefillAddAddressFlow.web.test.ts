import { act, renderHook, waitFor } from "@testing-library/react";
import { useDispatch } from "react-redux";
import { addAddress, ContactAddressValueSchema } from "@domain/entity-contact";
import {
  mockContact,
  mockDeviceContactGroupCredentials,
  mockExternalAddressDeviceContext,
} from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  createMockContactDeviceIntentsPort,
  useContacts,
  type ContactsAddressValidationPort,
} from "@features/platform-contacts";
import type { OpenPrefillAddAddressParams } from "./prefillAddAddress";
import { requestPrefillAddAddressFlow } from "./prefillAddAddressFlowStore";
import {
  isPrefillAddAddressFlowOpen,
  usePrefillAddAddressFlow,
  type UsePrefillAddAddressFlowOptions,
} from "./usePrefillAddAddressFlow";

jest.mock("@features/platform-contacts", () => ({
  ...jest.requireActual("@features/platform-contacts"),
  useContacts: jest.fn(),
}));

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: jest.fn(),
}));

const mockedUseContacts = jest.mocked(useContacts);
const mockedUseDispatch = jest.mocked(useDispatch);
const ETHEREUM_CURRENCY_ID = getCryptoCurrencyById("ethereum").id;
const RAW_ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const VALID_ADDRESS = ContactAddressValueSchema.parse(RAW_ADDRESS);
const PREFILL_PARAMS: OpenPrefillAddAddressParams = {
  contactId: mockContact().id,
  address: RAW_ADDRESS,
  currency: { currencyId: ETHEREUM_CURRENCY_ID, assetDisplayName: "Ethereum" },
  network: { networkId: "ethereum", displayName: "Ethereum" },
};

function createValidationPort(): ContactsAddressValidationPort & {
  validateAddress: jest.MockedFunction<ContactsAddressValidationPort["validateAddress"]>;
} {
  return {
    validateAddress: jest.fn().mockResolvedValue({
      status: "valid",
      resolvedAddress: VALID_ADDRESS,
      isDomain: false,
    }),
  };
}

function openPrefillFlow() {
  return requestPrefillAddAddressFlow(PREFILL_PARAMS);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function renderPrefillFlow(
  options: Omit<UsePrefillAddAddressFlowOptions, "deviceIntents"> &
    Partial<Pick<UsePrefillAddAddressFlowOptions, "deviceIntents">>,
) {
  const deviceIntents = options.deviceIntents ?? createMockContactDeviceIntentsPort();

  return renderHook(() => usePrefillAddAddressFlow({ ...options, deviceIntents }));
}

describe("usePrefillAddAddressFlow", () => {
  const dispatch = jest.fn();
  const contact = mockContact({ addresses: [] });

  beforeEach(() => {
    dispatch.mockReset();
    mockedUseDispatch.mockReturnValue(dispatch);
    mockedUseContacts.mockReturnValue([contact]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should mark a prefilled naming state as open", () => {
    expect(
      isPrefillAddAddressFlowOpen({
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
      }),
    ).toBe(true);
  });

  it("should resolve as unavailable when the contact is missing", async () => {
    mockedUseContacts.mockReturnValue([]);
    const addressValidation = createValidationPort();
    renderPrefillFlow({ addressValidation });

    await expect(requestPrefillAddAddressFlow(PREFILL_PARAMS)).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("should cancel a pending request when the flow is closed from naming", async () => {
    const addressValidation = createValidationPort();
    const { result } = renderPrefillFlow({ addressValidation });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    act(() => {
      result.current.onBack();
    });

    await expect(pending).resolves.toEqual({ status: "cancelled" });
    expect(result.current.state).toEqual({ status: "closed" });
  });

  it("should save the address from review and settle as saved", async () => {
    const addressValidation = createValidationPort();
    const deviceCredentials = mockDeviceContactGroupCredentials();
    const addressDeviceContext = mockExternalAddressDeviceContext();
    const deviceIntents = {
      registerExternalAddress: jest.fn().mockResolvedValue({
        deviceCredentials,
        addressDeviceContext,
      }),
      renameExternalContact: jest.fn(),
      editExternalAddress: jest.fn(),
    };
    const { result } = renderPrefillFlow({
      addressValidation,
      deviceIntents,
      createAddressId: () => "address-prefill",
    });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    act(() => {
      result.current.updateAddressLabel("Exchange");
      result.current.continueFromName();
    });

    await act(async () => {
      await result.current.saveFromReview();
    });

    const resolved = await pending;
    expect(resolved).toMatchObject({
      status: "saved",
      address: {
        id: "address-prefill",
        currencyId: ETHEREUM_CURRENCY_ID,
        label: "Exchange",
        address: VALID_ADDRESS,
        device: addressDeviceContext,
      },
    });
    expect(dispatch).toHaveBeenCalledWith(
      addAddress({
        contactId: contact.id,
        address: expect.objectContaining({ id: "address-prefill" }),
        deviceCredentials,
      }),
    );
    expect(result.current.state).toEqual({ status: "closed" });
  });

  it("should settle as confirmation_failed when device confirmation throws", async () => {
    const addressValidation = createValidationPort();
    const deviceIntents = {
      registerExternalAddress: jest.fn().mockRejectedValue(new Error("device")),
      renameExternalContact: jest.fn(),
      editExternalAddress: jest.fn(),
    };
    const { result } = renderPrefillFlow({ addressValidation, deviceIntents });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    act(() => {
      result.current.continueFromName();
    });

    await act(async () => {
      await result.current.saveFromReview();
    });

    await expect(pending).resolves.toEqual({ status: "confirmation_failed" });
  });

  it("should settle as unavailable when the root unmounts", async () => {
    const addressValidation = createValidationPort();
    const { result, unmount } = renderPrefillFlow({ addressValidation });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    unmount();

    await expect(pending).resolves.toEqual({ status: "unavailable" });
  });

  it("should settle as unavailable when the root unmounts while the flow is starting", async () => {
    const addressValidation = createValidationPort();
    const validation =
      deferred<Awaited<ReturnType<ContactsAddressValidationPort["validateAddress"]>>>();
    addressValidation.validateAddress.mockReturnValue(validation.promise);
    const { unmount } = renderPrefillFlow({ addressValidation });
    const pending = openPrefillFlow();

    unmount();
    await act(async () => {
      validation.resolve({ status: "valid", resolvedAddress: VALID_ADDRESS, isDomain: false });
    });

    await expect(pending).resolves.toEqual({ status: "unavailable" });
  });

  it("should not persist the address when the flow is cancelled during device confirmation", async () => {
    const addressValidation = createValidationPort();
    const confirmation = deferred<{
      deviceCredentials: ReturnType<typeof mockDeviceContactGroupCredentials>;
      addressDeviceContext: ReturnType<typeof mockExternalAddressDeviceContext>;
    }>();
    const deviceIntents = {
      registerExternalAddress: jest.fn().mockReturnValue(confirmation.promise),
      renameExternalContact: jest.fn(),
      editExternalAddress: jest.fn(),
    };
    const { result } = renderPrefillFlow({ addressValidation, deviceIntents });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    act(() => {
      result.current.continueFromName();
    });

    let saving: Promise<void>;
    act(() => {
      saving = result.current.saveFromReview();
    });
    act(() => {
      result.current.onClose();
    });

    await act(async () => {
      confirmation.resolve({
        deviceCredentials: mockDeviceContactGroupCredentials(),
        addressDeviceContext: mockExternalAddressDeviceContext(),
      });
      await saving;
    });

    await expect(pending).resolves.toEqual({ status: "cancelled" });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should return unavailable when a second open is requested while one is pending", async () => {
    const addressValidation = createValidationPort();
    const { result } = renderPrefillFlow({ addressValidation });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    await expect(openPrefillFlow()).resolves.toEqual({ status: "unavailable" });

    act(() => {
      result.current.onClose();
    });
    await pending;
  });

  it("should return the start result when the supplied address is invalid", async () => {
    const addressValidation = createValidationPort();
    addressValidation.validateAddress.mockResolvedValue({ status: "invalid_format" });
    renderPrefillFlow({ addressValidation });

    await expect(openPrefillFlow()).resolves.toEqual({
      status: "invalid_address",
      error: "invalid_format",
    });
  });

  it("should go back from review to naming without cancelling", async () => {
    const addressValidation = createValidationPort();
    const { result } = renderPrefillFlow({ addressValidation });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    act(() => {
      result.current.continueFromName();
    });
    act(() => {
      result.current.onBack();
    });

    expect(result.current.state.status).toBe("namingAddress");
    act(() => {
      result.current.onClose();
    });
    await expect(pending).resolves.toEqual({ status: "cancelled" });
  });

  it("should settle as confirmation_failed when the selected contact is gone", async () => {
    const addressValidation = createValidationPort();
    const { result, rerender } = renderPrefillFlow({ addressValidation });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    act(() => {
      result.current.continueFromName();
    });
    mockedUseContacts.mockReturnValue([]);
    rerender();

    await act(async () => {
      await result.current.saveFromReview();
    });

    await expect(pending).resolves.toEqual({ status: "confirmation_failed" });
  });

  it("should ignore saveFromReview when the flow is not reviewing", async () => {
    const addressValidation = createValidationPort();
    const { result } = renderPrefillFlow({ addressValidation });
    const pending = openPrefillFlow();

    await waitFor(() => {
      expect(result.current.state.status).toBe("namingAddress");
    });

    await act(async () => {
      await result.current.saveFromReview();
    });

    expect(result.current.state.status).toBe("namingAddress");
    act(() => {
      result.current.onClose();
    });
    await pending;
  });
});
