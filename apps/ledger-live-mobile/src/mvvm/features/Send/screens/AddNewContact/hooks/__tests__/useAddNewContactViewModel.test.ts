import { act, renderHook, waitFor } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { addAddress } from "@domain/entity-contact";
import {
  mockContact,
  mockDeviceContactGroupCredentials,
  mockExternalAddressDeviceContext,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { useContactsAddContactDrawerAdapter } from "LLM/features/Contacts/screens/ContactsPage/hooks/useContactsAddContactDrawerAdapter";
import { useContactsAddressValidationAdapter } from "LLM/features/Contacts/hooks/useContactsAddressValidationAdapter";
import { useSendFlowData } from "LLM/features/Send/context/SendFlowContext";
import { useAddNewContactViewModel } from "../useAddNewContactViewModel";

const validateAddress = jest.fn();
const registerExternalAddress = jest.fn();
const dispatch = jest.fn();
const adapterResult = {
  labels: { title: "Add contact" },
  onOpen: jest.fn(),
  onClose: jest.fn(),
  isOpen: false,
  isSaving: false,
};

jest.mock("LLM/features/Send/context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => dispatch,
}));

jest.mock("@features/platform-contacts", () => ({
  ...jest.requireActual("@features/platform-contacts"),
  createMockContactDeviceIntentsPort: () => ({ registerExternalAddress }),
}));

jest.mock(
  "LLM/features/Contacts/screens/ContactsPage/hooks/useContactsAddContactDrawerAdapter",
  () => ({
    useContactsAddContactDrawerAdapter: jest.fn(),
  }),
);

jest.mock("LLM/features/Contacts/hooks/useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: jest.fn(),
}));

const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseContactsAddContactDrawerAdapter = jest.mocked(useContactsAddContactDrawerAdapter);
const mockedUseContactsAddressValidationAdapter = jest.mocked(useContactsAddressValidationAdapter);

function countAddAddressDispatches(): number {
  return dispatch.mock.calls.filter(([action]) => action?.type === addAddress.type).length;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useAddNewContactViewModel", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
  const createdContact = mockContact({ id: "contact-ada", addresses: [] });
  const signedAddress = {
    deviceCredentials: mockDeviceContactGroupCredentials(),
    addressDeviceContext: mockExternalAddressDeviceContext(),
  };

  function renderDrawer() {
    const rendered = renderHook(() => useAddNewContactViewModel());
    act(() => rendered.result.current.onOpen());
    return rendered;
  }

  async function renderAtReviewStep() {
    const rendered = renderDrawer();
    act(() => rendered.result.current.onAddNewContact());
    const onSaveSuccess = mockedUseContactsAddContactDrawerAdapter.mock.calls.at(-1)?.[0];

    await act(async () => {
      await onSaveSuccess?.(createdContact);
    });
    await waitFor(() => {
      expect(rendered.result.current.addressPhase?.state.status).toBe("namingAddress");
    });

    act(() => rendered.result.current.addressPhase?.onAddressLabelChange("Exchange"));
    act(() => rendered.result.current.addressPhase?.onContinueFromName());
    await waitFor(() => {
      expect(rendered.result.current.addressPhase?.state.status).toBe("reviewingAddress");
    });

    return rendered;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    registerExternalAddress.mockResolvedValue(signedAddress);
    mockedUseContactsAddContactDrawerAdapter.mockReturnValue(adapterResult as never);
    mockedUseContactsAddressValidationAdapter.mockReturnValue({
      validateAddress,
    });
    validateAddress.mockResolvedValue({
      status: "valid",
      resolvedAddress: address,
      isDomain: false,
    });
    mockedUseSendFlowData.mockReturnValue({
      state: { account: { currency: ethereum } },
      recipientSearch: { value: address },
    } as never);
  });

  it("should open the chooser before the contact or address phases", () => {
    const { result } = renderDrawer();

    expect(result.current.drawerStep).toBe("chooser");
    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.addressPhase).toBeNull();
    expect(mockedUseContactsAddContactDrawerAdapter).toHaveBeenCalled();
  });

  it("should start the add-address flow after creating a contact", async () => {
    const { result } = renderDrawer();
    act(() => result.current.onAddNewContact());
    const onSaveSuccess = mockedUseContactsAddContactDrawerAdapter.mock.calls.at(-1)?.[0];

    await act(async () => {
      await onSaveSuccess?.(createdContact);
    });

    await waitFor(() => {
      expect(result.current.addressPhase?.state.status).toBe("namingAddress");
    });
    expect(result.current.addressPhase?.state.entryMode).toBe("prefilled");
    expect(validateAddress).toHaveBeenCalledWith({
      currencyId: ethereum.id,
      address,
    });
  });

  it("should keep the drawer open on the contact step while the address is being validated", async () => {
    const deferredValidation = createDeferred<{
      status: string;
      resolvedAddress: string;
      isDomain: boolean;
    }>();
    validateAddress.mockReturnValue(deferredValidation.promise);

    const { result } = renderDrawer();
    act(() => result.current.onAddNewContact());
    const onSaveSuccess = mockedUseContactsAddContactDrawerAdapter.mock.calls.at(-1)?.[0];

    act(() => {
      void onSaveSuccess?.(createdContact);
    });

    await waitFor(() => {
      expect(result.current.isOpeningAddressFlow).toBe(true);
    });
    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.drawerStep).toBe("contact");

    await act(async () => {
      deferredValidation.resolve({
        status: "valid",
        resolvedAddress: address,
        isDomain: false,
      });
      await deferredValidation.promise;
    });

    await waitFor(() => {
      expect(result.current.drawerStep).toBe("name");
    });
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("should close the drawer immediately when dismissed during address validation", async () => {
    const deferredValidation = createDeferred<{
      status: string;
      resolvedAddress: string;
      isDomain: boolean;
    }>();
    validateAddress.mockReturnValue(deferredValidation.promise);

    const { result } = renderDrawer();
    act(() => result.current.onAddNewContact());
    const onSaveSuccess = mockedUseContactsAddContactDrawerAdapter.mock.calls.at(-1)?.[0];

    act(() => {
      void onSaveSuccess?.(createdContact);
    });

    await waitFor(() => {
      expect(result.current.isOpeningAddressFlow).toBe(true);
    });

    act(() => result.current.onDrawerClose());

    expect(result.current.isOpeningAddressFlow).toBe(false);
    expect(result.current.isDrawerOpen).toBe(false);

    await act(async () => {
      deferredValidation.resolve({
        status: "valid",
        resolvedAddress: address,
        isDomain: false,
      });
      await deferredValidation.promise;
    });

    expect(result.current.addressPhase).toBeNull();
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it("should not start the add-address flow when the address cannot be mapped", async () => {
    mockedUseSendFlowData.mockReturnValue({
      state: { account: { currency: ethereum } },
      recipientSearch: { value: "   " },
    } as never);

    const { result } = renderDrawer();
    act(() => result.current.onAddNewContact());
    const onSaveSuccess = mockedUseContactsAddContactDrawerAdapter.mock.calls.at(-1)?.[0];

    await act(async () => {
      await onSaveSuccess?.(createdContact);
    });

    expect(validateAddress).not.toHaveBeenCalled();
    expect(result.current.addressPhase).toBeNull();
  });

  it("should register the address only once when the review action is triggered twice", async () => {
    const deferredRegistration = createDeferred<typeof signedAddress>();
    registerExternalAddress.mockReturnValue(deferredRegistration.promise);

    const { result } = await renderAtReviewStep();

    act(() => {
      result.current.addressPhase?.onContinueFromReview();
      result.current.addressPhase?.onContinueFromReview();
    });

    await act(async () => {
      deferredRegistration.resolve(signedAddress);
      await deferredRegistration.promise;
    });

    expect(registerExternalAddress).toHaveBeenCalledTimes(1);
    expect(countAddAddressDispatches()).toBe(1);
    expect(result.current.addressPhase).toBeNull();
  });

  it("should discard a pending registration when the user goes back", async () => {
    const deferredRegistration = createDeferred<typeof signedAddress>();
    registerExternalAddress.mockReturnValue(deferredRegistration.promise);

    const { result } = await renderAtReviewStep();

    act(() => result.current.addressPhase?.onContinueFromReview());
    act(() => result.current.onDrawerBack?.());

    await act(async () => {
      deferredRegistration.resolve(signedAddress);
      await deferredRegistration.promise;
    });

    expect(countAddAddressDispatches()).toBe(0);
    expect(result.current.addressPhase?.state.status).toBe("namingAddress");
  });

  it("should start the name address flow after selecting an existing contact", async () => {
    const { result } = renderDrawer();

    act(() => result.current.onAddToExistingContact());
    expect(result.current.drawerStep).toBe("select");

    await act(async () => {
      result.current.selectContact.onSelectContact(mockMeContact().id);
    });

    await waitFor(() => {
      expect(result.current.addressPhase?.state.status).toBe("namingAddress");
    });
    expect(result.current.drawerStep).toBe("name");
    expect(validateAddress).toHaveBeenCalledWith({
      currencyId: ethereum.id,
      address,
    });
  });

  it("should return to the chooser when going back from the select contact step", () => {
    const { result } = renderDrawer();

    act(() => result.current.onAddToExistingContact());
    act(() => result.current.onDrawerBack?.());

    expect(result.current.drawerStep).toBe("chooser");
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("should close the drawer when going back from naming an address after creating a contact", async () => {
    const { result } = renderDrawer();
    act(() => result.current.onAddNewContact());
    const onSaveSuccess = mockedUseContactsAddContactDrawerAdapter.mock.calls.at(-1)?.[0];

    await act(async () => {
      await onSaveSuccess?.(createdContact);
    });
    await waitFor(() => {
      expect(result.current.drawerStep).toBe("name");
    });

    act(() => result.current.onDrawerBack?.());

    expect(result.current.addressPhase).toBeNull();
    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.drawerStep).toBe("chooser");
  });

  it("should return to the select contact step when going back from naming an address for an existing contact", async () => {
    const { result } = renderDrawer();

    act(() => result.current.onAddToExistingContact());
    await act(async () => {
      result.current.selectContact.onSelectContact(mockMeContact().id);
    });
    await waitFor(() => {
      expect(result.current.drawerStep).toBe("name");
    });

    act(() => result.current.onDrawerBack?.());

    expect(result.current.addressPhase).toBeNull();
    expect(result.current.drawerStep).toBe("select");
    expect(result.current.isDrawerOpen).toBe(true);
  });
});
