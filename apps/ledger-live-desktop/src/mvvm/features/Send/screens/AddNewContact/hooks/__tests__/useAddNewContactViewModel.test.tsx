/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, renderHook, waitFor } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { addAddress } from "@domain/entity-contact";
import {
  mockContact,
  mockDeviceContactGroupCredentials,
  mockExternalAddressDeviceContext,
} from "@domain/entity-contact/schema.mock";
import { useAddContactDialogViewModel } from "@features/flow-contacts-add-contact";
import { useContactsAddressValidationAdapter } from "LLD/features/Contacts/hooks/useContactsAddressValidationAdapter";
import {
  AddNewContactHeaderProvider,
  useAddNewContactHeaderState,
} from "../../../../context/AddNewContactHeaderContext";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { useAddNewContactViewModel } from "../useAddNewContactViewModel";

const goToStep = jest.fn();
const resetToStep = jest.fn();
const validateAddress = jest.fn();
const registerExternalAddress = jest.fn();
const dispatch = jest.fn();

jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({
    navigation: { goToStep, resetToStep },
  }),
}));

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => dispatch,
}));

jest.mock("@features/platform-contacts", () => ({
  ...jest.requireActual("@features/platform-contacts"),
  createMockContactDeviceIntentsPort: () => ({ registerExternalAddress }),
  useContacts: () => [],
  useContactsFeature: () => ({ isEnabled: true }),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));
jest.mock("../../../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: jest.fn(() => ({
    inputMethod: "manual",
    resultType: null,
    recipientType: null,
    savedContactDuringFlow: false,
    setInputMethod: jest.fn(),
    setRecipientResolution: jest.fn(),
    markContactSaved: jest.fn(),
  })),
}));

jest.mock("@features/flow-contacts-add-contact", () => ({
  ...jest.requireActual("@features/flow-contacts-add-contact"),
  createContactCreationPort: jest.fn(() => ({})),
  useAddContactDialogViewModel: jest.fn(),
}));

jest.mock("LLD/features/Contacts/hooks/useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: jest.fn(),
}));

const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseAddContactDialogViewModel = jest.mocked(useAddContactDialogViewModel);
const mockedUseContactsAddressValidationAdapter = jest.mocked(useContactsAddressValidationAdapter);

function wrapper({ children }: { children: React.ReactNode }) {
  return <AddNewContactHeaderProvider>{children}</AddNewContactHeaderProvider>;
}

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
  const adapterResult = {
    labels: { title: "Add contact" },
    onOpen: jest.fn(),
    onClose: jest.fn(),
  };

  const signedAddress = {
    deviceCredentials: mockDeviceContactGroupCredentials(),
    addressDeviceContext: mockExternalAddressDeviceContext(),
  };

  function renderViewModel() {
    return renderHook(
      () => ({
        viewModel: useAddNewContactViewModel(),
        header: useAddNewContactHeaderState(),
      }),
      { wrapper },
    );
  }

  async function renderAtReviewStep() {
    const rendered = renderViewModel();
    const onSaveSuccess = mockedUseAddContactDialogViewModel.mock.calls.at(-1)?.[0].onSaveSuccess;

    await act(async () => {
      await onSaveSuccess?.(createdContact);
    });
    await waitFor(() => {
      expect(rendered.result.current.viewModel.addressPhase?.state.status).toBe("namingAddress");
    });

    act(() => rendered.result.current.viewModel.addressPhase?.onAddressLabelChange("Exchange"));
    act(() => rendered.result.current.viewModel.addressPhase?.onContinueFromName());
    await waitFor(() => {
      expect(rendered.result.current.viewModel.addressPhase?.state.status).toBe("reviewingAddress");
    });

    return rendered;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    registerExternalAddress.mockResolvedValue(signedAddress);
    mockedUseAddContactDialogViewModel.mockReturnValue(adapterResult as never);
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

  it("should return the add contact adapter before the address phase", () => {
    const { result } = renderHook(() => useAddNewContactViewModel(), {
      wrapper,
    });

    expect(result.current).toEqual(expect.objectContaining(adapterResult));
    expect(result.current.addressPhase).toBeNull();
    expect(mockedUseAddContactDialogViewModel).toHaveBeenCalled();
  });

  it("should start the in-dialog add-address flow after creating a contact", async () => {
    const { result } = renderHook(() => useAddNewContactViewModel(), {
      wrapper,
    });
    const onSaveSuccess = mockedUseAddContactDialogViewModel.mock.calls.at(-1)?.[0].onSaveSuccess;

    await act(async () => {
      await onSaveSuccess?.(createdContact);
    });

    expect(goToStep).not.toHaveBeenCalled();
    expect(resetToStep).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.addressPhase?.state.status).toBe("namingAddress");
    });
    expect(result.current.addressPhase?.state.entryMode).toBe("prefilled");
    expect(validateAddress).toHaveBeenCalledWith({
      currencyId: ethereum.id,
      address,
    });
  });

  it("should return to recipient when the address cannot be mapped", async () => {
    mockedUseSendFlowData.mockReturnValue({
      state: { account: { currency: ethereum } },
      recipientSearch: { value: "   " },
    } as never);

    renderHook(() => useAddNewContactViewModel(), { wrapper });
    const onSaveSuccess = mockedUseAddContactDialogViewModel.mock.calls.at(-1)?.[0].onSaveSuccess;

    await act(async () => {
      await onSaveSuccess?.(createdContact);
    });

    expect(resetToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.RECIPIENT);
    expect(goToStep).not.toHaveBeenCalled();
    expect(validateAddress).not.toHaveBeenCalled();
  });

  it("should return to recipient when the add-address flow cannot start", async () => {
    validateAddress.mockResolvedValue({ status: "unavailable" });

    const { result } = renderHook(() => useAddNewContactViewModel(), {
      wrapper,
    });
    const onSaveSuccess = mockedUseAddContactDialogViewModel.mock.calls.at(-1)?.[0].onSaveSuccess;

    await act(async () => {
      await onSaveSuccess?.(createdContact);
    });

    expect(resetToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.RECIPIENT);
    expect(goToStep).not.toHaveBeenCalled();
    expect(result.current.addressPhase).toBeNull();
  });

  it("should stay where the user navigated when the add-address flow start is cancelled", async () => {
    const deferredValidation = createDeferred<unknown>();
    validateAddress.mockReturnValue(deferredValidation.promise);

    const { unmount } = renderHook(() => useAddNewContactViewModel(), {
      wrapper,
    });
    const onSaveSuccess = mockedUseAddContactDialogViewModel.mock.calls.at(-1)?.[0].onSaveSuccess;

    act(() => {
      onSaveSuccess?.(createdContact);
    });
    unmount();

    await act(async () => {
      deferredValidation.resolve({
        status: "valid",
        resolvedAddress: address,
        isDomain: false,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(resetToStep).not.toHaveBeenCalled();
  });

  it("should register the address only once when the review action is triggered twice", async () => {
    const deferredRegistration = createDeferred<typeof signedAddress>();
    registerExternalAddress.mockReturnValue(deferredRegistration.promise);

    const { result } = await renderAtReviewStep();

    act(() => {
      result.current.viewModel.addressPhase?.onContinueFromReview();
      result.current.viewModel.addressPhase?.onContinueFromReview();
    });

    await act(async () => {
      deferredRegistration.resolve(signedAddress);
      await deferredRegistration.promise;
    });

    expect(registerExternalAddress).toHaveBeenCalledTimes(1);
    expect(countAddAddressDispatches()).toBe(1);
    expect(resetToStep).toHaveBeenCalledTimes(1);
  });

  it("should discard a pending registration when the user goes back", async () => {
    const deferredRegistration = createDeferred<typeof signedAddress>();
    registerExternalAddress.mockReturnValue(deferredRegistration.promise);

    const { result } = await renderAtReviewStep();

    act(() => result.current.viewModel.addressPhase?.onContinueFromReview());
    act(() => result.current.header.onAddressPhaseBack?.());

    await act(async () => {
      deferredRegistration.resolve(signedAddress);
      await deferredRegistration.promise;
    });

    expect(countAddAddressDispatches()).toBe(0);
    expect(resetToStep).not.toHaveBeenCalled();
    expect(result.current.viewModel.addressPhase?.state.status).toBe("namingAddress");
  });
});
