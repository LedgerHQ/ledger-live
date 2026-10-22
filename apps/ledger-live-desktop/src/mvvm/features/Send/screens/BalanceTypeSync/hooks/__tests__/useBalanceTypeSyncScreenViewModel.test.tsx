import { act, renderHook } from "tests/testSetup";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { FlowNavigationActions } from "LLD/features/FlowWizard/types";
import { useFlowWizardNavigation } from "LLD/features/FlowWizard/hooks/useFlowWizardNavigation";
import { useLLDCoinFamily } from "~/renderer/families";
import { SEND_FLOW_CONFIG } from "../../../../constants";
import { useBalanceTypeSyncScreenViewModel } from "../useBalanceTypeSyncScreenViewModel";

let mockNavigation: FlowNavigationActions<SendFlowStep> | null = null;
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: mockNavigation }),
}));

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(),
}));

const mockClose = jest.fn();
const account = { id: "aleo-1", type: "Account", currency: { family: "aleo" } };
const transaction = { family: "aleo", mode: "transfer_private" };
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: { account, parentAccount: null },
      transaction: { transaction },
    },
  }),
  useSendFlowActions: () => ({ close: mockClose }),
}));

const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);
const SendBalanceTypeSync = () => null;

function renderViewModel() {
  return renderHook(() => {
    const navigation = useFlowWizardNavigation({
      flowConfig: {
        ...SEND_FLOW_CONFIG,
        initialStep: SEND_FLOW_STEP.BALANCE_TYPE_SYNC,
        initialHistory: [SEND_FLOW_STEP.BALANCE_TYPE],
      },
    });
    mockNavigation = navigation.actions;
    return { navigation, viewModel: useBalanceTypeSyncScreenViewModel() };
  });
}

describe("useBalanceTypeSyncScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseLLDCoinFamily.mockReturnValue({ SendBalanceTypeSync } as never);
  });

  it("exposes the family slot with the flow's main account and transaction", () => {
    const { result } = renderViewModel();

    expect(mockedUseLLDCoinFamily).toHaveBeenCalledWith("aleo");
    expect(result.current.viewModel).toMatchObject({ SendBalanceTypeSync, account, transaction });
  });

  it("moves on to the recipient step, with the pool choice as the step to go back to", () => {
    const { result } = renderViewModel();

    act(() => result.current.viewModel.onComplete());

    expect(result.current.navigation.state.currentStep).toBe(SEND_FLOW_STEP.RECIPIENT);
    expect(result.current.navigation.state.stepHistory).toEqual([SEND_FLOW_STEP.BALANCE_TYPE]);

    act(() => result.current.navigation.actions.goToPreviousStep());

    expect(result.current.navigation.state.currentStep).toBe(SEND_FLOW_STEP.BALANCE_TYPE);
  });

  it("closes the flow", () => {
    const { result } = renderViewModel();

    result.current.viewModel.onClose();

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
