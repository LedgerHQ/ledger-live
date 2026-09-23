import { renderHook } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSponsoredPhaseNavigator } from "../useSponsoredPhaseNavigator";

const mockGoToStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: { goToStep: mockGoToStep } }),
}));

let mockPhase: string;
jest.mock("../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: { phase: mockPhase } }),
}));

describe("useSponsoredPhaseNavigator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPhase = SPONSORED_PHASE.IDLE;
  });

  it.each([
    [SPONSORED_PHASE.RENT_SIGNING, SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE],
    [SPONSORED_PHASE.POLLING, SEND_FLOW_STEP.SPONSORED_POLLING],
    [SPONSORED_PHASE.TRANSFER, SEND_FLOW_STEP.SIGNATURE],
    [SPONSORED_PHASE.FAILED, SEND_FLOW_STEP.SPONSORED_FAILURE],
  ])("routes phase %s to its step", (phase, step) => {
    const { rerender } = renderHook(() => useSponsoredPhaseNavigator());

    mockPhase = phase;
    rerender();

    expect(mockGoToStep).toHaveBeenCalledWith(step);
  });

  it.each([SPONSORED_PHASE.IDLE, SPONSORED_PHASE.DONE])(
    "does not navigate for the stepless phase %s",
    phase => {
      const { rerender } = renderHook(() => useSponsoredPhaseNavigator());

      mockPhase = phase;
      rerender();

      expect(mockGoToStep).not.toHaveBeenCalled();
    },
  );

  it("does not re-navigate on a re-render at the same phase", () => {
    const { rerender } = renderHook(() => useSponsoredPhaseNavigator());

    mockPhase = SPONSORED_PHASE.POLLING;
    rerender();
    rerender();

    expect(mockGoToStep).toHaveBeenCalledTimes(1);
  });

  it("navigates each transition across the happy path, then again when a retry cycles back", () => {
    const { rerender } = renderHook(() => useSponsoredPhaseNavigator());

    for (const phase of [
      SPONSORED_PHASE.RENT_SIGNING,
      SPONSORED_PHASE.POLLING,
      SPONSORED_PHASE.TRANSFER,
    ]) {
      mockPhase = phase;
      rerender();
    }
    expect(mockGoToStep).toHaveBeenNthCalledWith(1, SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE);
    expect(mockGoToStep).toHaveBeenNthCalledWith(2, SEND_FLOW_STEP.SPONSORED_POLLING);
    expect(mockGoToStep).toHaveBeenNthCalledWith(3, SEND_FLOW_STEP.SIGNATURE);

    // A DELIVERY_FAILED retry: FAILED -> RENT_SIGNING must route back to the rent-signature step.
    mockPhase = SPONSORED_PHASE.FAILED;
    rerender();
    mockPhase = SPONSORED_PHASE.RENT_SIGNING;
    rerender();

    expect(mockGoToStep).toHaveBeenNthCalledWith(4, SEND_FLOW_STEP.SPONSORED_FAILURE);
    expect(mockGoToStep).toHaveBeenNthCalledWith(5, SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE);
  });
});
