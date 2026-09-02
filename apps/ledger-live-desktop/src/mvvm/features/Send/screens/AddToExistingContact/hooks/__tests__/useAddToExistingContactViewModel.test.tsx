/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, renderHook, waitFor } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useContactsAddressValidationAdapter } from "LLD/features/Contacts/hooks/useContactsAddressValidationAdapter";
import { AddNewContactHeaderProvider } from "LLD/features/Send/context/AddNewContactHeaderContext";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { useAddToExistingContactViewModel } from "../useAddToExistingContactViewModel";

const goToStep = jest.fn();
const resetToStep = jest.fn();
const validateAddress = jest.fn();
const registerExternalAddress = jest.fn();
const dispatch = jest.fn();
const ada = mockContact({ id: "contact-ada", name: "Ada" });
const me = mockMeContact();

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
  useContacts: () => [me, ada],
  useContactsMeContact: () => me,
}));

jest.mock("@features/platform-contacts/device", () => ({
  useContactsIntentsOrchestrator: () => ({
    deviceIntents: { registerExternalAddress },
    dieProps: undefined,
  }),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

jest.mock("LLD/features/Contacts/hooks/useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: jest.fn(),
}));

const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseContactsAddressValidationAdapter = jest.mocked(useContactsAddressValidationAdapter);

function wrapper({ children }: { children: React.ReactNode }) {
  return <AddNewContactHeaderProvider>{children}</AddNewContactHeaderProvider>;
}

describe("useAddToExistingContactViewModel", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

  beforeEach(() => {
    jest.clearAllMocks();
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

  it("should start the name address flow after selecting a contact", async () => {
    const { result } = renderHook(() => useAddToExistingContactViewModel(), { wrapper });

    await act(async () => {
      result.current.onSelectContact(ada.id);
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
});
