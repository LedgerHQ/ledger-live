import { renderHook, act } from "tests/testSetup";
import {
  useLedgerSyncAnalytics,
  StepMappedToAnalytics,
  AnalyticsPage,
  StepsOutsideFlow,
} from "../hooks/useLedgerSyncAnalytics";
import { Step } from "~/renderer/reducers/walletSync";

const mockTrack = jest.fn();
jest.mock("~/renderer/analytics/segment", () => ({
  track: (event: string, props?: Record<string, unknown>) => mockTrack(event, props),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useLedgerSyncAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call track with button and page on onClickTrack", () => {
    const { result } = renderHook(() => useLedgerSyncAnalytics());

    act(() => {
      result.current.onClickTrack({ button: "Turn on", page: AnalyticsPage.Activation });
    });

    expect(mockTrack).toHaveBeenCalledWith("button_clicked2", {
      button: "Turn on",
      page: AnalyticsPage.Activation,
      flow: undefined,
    });
  });

  it("should call track with step mapped to analytics page on onActionTrack", () => {
    const { result } = renderHook(() => useLedgerSyncAnalytics());

    act(() => {
      result.current.onActionTrack({
        button: "Back",
        step: Step.DeleteBackup,
        flow: "Ledger Sync",
      });
    });

    expect(mockTrack).toHaveBeenCalledWith("button_clicked2", {
      button: "Back",
      page: StepMappedToAnalytics[Step.DeleteBackup],
      flow: "Ledger Sync",
    });
  });
});

describe("StepMappedToAnalytics and StepsOutsideFlow", () => {
  it("should map Step.DeleteBackup to ConfirmDeleteBackup", () => {
    expect(StepMappedToAnalytics[Step.DeleteBackup]).toBe(AnalyticsPage.ConfirmDeleteBackup);
  });

  it("should include LedgerSyncActivated in StepsOutsideFlow", () => {
    expect(StepsOutsideFlow).toContain(Step.LedgerSyncActivated);
  });
});
