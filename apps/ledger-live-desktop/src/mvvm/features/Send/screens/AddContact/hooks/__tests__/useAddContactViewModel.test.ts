/**
 * @jest-environment jsdom
 */
import { renderHook } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useAddContactViewModel } from "../useAddContactViewModel";

const goToStep = jest.fn();

jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({
    navigation: { goToStep },
  }),
}));
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: { account: { account: null, parentAccount: null } },
  }),
}));

describe("useAddContactViewModel", () => {
  beforeEach(() => {
    goToStep.mockClear();
  });

  it("should open the add new contact step", () => {
    const { result } = renderHook(() => useAddContactViewModel());

    result.current.onAddNewContact?.();

    expect(goToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.ADD_NEW_CONTACT);
  });

  it("should open the add to existing contact step", () => {
    const { result } = renderHook(() => useAddContactViewModel());

    result.current.onAddToExistingContact?.();

    expect(goToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.ADD_TO_EXISTING_CONTACT);
  });
});
