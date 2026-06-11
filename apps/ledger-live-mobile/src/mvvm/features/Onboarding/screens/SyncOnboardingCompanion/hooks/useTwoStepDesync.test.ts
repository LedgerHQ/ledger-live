import { act, renderHook } from "@tests/test-renderer";
import useTwoStepDesync, { NORMAL_DESYNC_OVERLAY_DISPLAY_DELAY_MS } from "./useTwoStepDesync";

jest.useFakeTimers();

describe("useTwoStepDesync", () => {
  const onLostDevice = jest.fn();
  const onShouldHeaderBeOverlaid = jest.fn();
  const updateHeaderOverlayDelay = jest.fn();
  const setIsPollingOn = jest.fn();

  const defaultProps = () => ({
    onLostDevice,
    onShouldHeaderBeOverlaid,
    updateHeaderOverlayDelay,
    setIsPollingOn,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should start with overlay closed and normal display delay", () => {
    const { result } = renderHook(() => useTwoStepDesync(defaultProps()));

    expect(result.current.isDesyncOverlayOpen).toBe(false);
    expect(result.current.desyncOverlayDisplayDelayMs).toBe(
      NORMAL_DESYNC_OVERLAY_DISPLAY_DELAY_MS,
    );
  });

  it("should open overlay and overlay header when polling error occurs", () => {
    const { result } = renderHook(() => useTwoStepDesync(defaultProps()));

    act(() => {
      result.current.handlePollingError(new Error("desync"));
    });

    expect(result.current.isDesyncOverlayOpen).toBe(true);
    expect(onShouldHeaderBeOverlaid).toHaveBeenCalledWith(true);
  });

  it("should close overlay when polling error is cleared", () => {
    const { result } = renderHook(() => useTwoStepDesync(defaultProps()));

    act(() => {
      result.current.handlePollingError(new Error("desync"));
    });

    act(() => {
      result.current.handlePollingError(null);
    });

    expect(result.current.isDesyncOverlayOpen).toBe(false);
    expect(onShouldHeaderBeOverlaid).toHaveBeenLastCalledWith(false);
  });

  it("should call onLostDevice and stop polling after desync timeout", () => {
    const { result } = renderHook(() => useTwoStepDesync(defaultProps()));

    act(() => {
      result.current.handlePollingError(new Error("desync"));
    });

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(onLostDevice).toHaveBeenCalled();
    expect(setIsPollingOn).toHaveBeenCalledWith(false);
    expect(result.current.isDesyncOverlayOpen).toBe(false);
  });

  it("should switch to long delays when seed generation delay is triggered", () => {
    const { result } = renderHook(() => useTwoStepDesync(defaultProps()));

    act(() => {
      result.current.handleSeedGenerationDelay();
    });

    expect(result.current.desyncOverlayDisplayDelayMs).toBe(60000);
    expect(updateHeaderOverlayDelay).toHaveBeenCalledWith(60000);
  });
});
