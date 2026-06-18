import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { EntryPoint } from "../../types/AnalyticsOptInPromptNavigator";
import { ANALYTICS_OPT_IN_VARIANT } from "../../types/variants";
import { useDrawerLogic } from "../useDrawerLogic";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

describe("useDrawerLogic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should prevent closing on portfolio entry point", () => {
    const { result } = renderHook(() =>
      useDrawerLogic({
        entryPoint: EntryPoint.portfolio,
        shouldWeTrack: true,
        onClose: jest.fn(),
      }),
    );

    expect(result.current.preventClosable).toBe(true);
  });

  it("should allow closing on onboarding entry point", () => {
    const { result } = renderHook(() =>
      useDrawerLogic({
        entryPoint: EntryPoint.onboarding,
        shouldWeTrack: true,
        onClose: jest.fn(),
      }),
    );

    expect(result.current.preventClosable).toBe(false);
  });

  it("should decrement the step and track back", () => {
    const { result } = renderHook(() =>
      useDrawerLogic({
        entryPoint: EntryPoint.onboarding,
        shouldWeTrack: true,
        onClose: jest.fn(),
      }),
    );

    act(() => {
      result.current.setStep(1);
    });

    act(() => {
      result.current.handleRequestBack();
    });

    expect(result.current.step).toBe(0);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      { button: "back", entryPoint: EntryPoint.onboarding, variant: ANALYTICS_OPT_IN_VARIANT },
      true,
    );
  });

  it("should close the drawer and track close", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useDrawerLogic({
        entryPoint: EntryPoint.portfolio,
        shouldWeTrack: false,
        onClose,
      }),
    );

    act(() => {
      result.current.handleRequestClose();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      { button: "close", entryPoint: EntryPoint.portfolio, variant: ANALYTICS_OPT_IN_VARIANT },
      false,
    );
  });

  it("should track close with mandatory when shouldWeTrack is true", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useDrawerLogic({
        entryPoint: EntryPoint.onboarding,
        shouldWeTrack: true,
        onClose,
      }),
    );

    act(() => {
      result.current.handleRequestClose();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      { button: "close", entryPoint: EntryPoint.onboarding, variant: ANALYTICS_OPT_IN_VARIANT },
      true,
    );
  });
});
