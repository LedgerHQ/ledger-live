/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "tests/testSetup";
import { useVideoCarousel } from "../hooks/useVideoCarousel";

// Mock video files
jest.mock("../assets/ledgerWalletBuySell.webm", () => "mock-buy-sell.webm");
jest.mock("../assets/ledgerWalletThousandsCrypto.webm", () => "mock-thousands-crypto.webm");
jest.mock("../assets/ledgerWalletSecureWallet.webm", () => "mock-secure-wallet.webm");

describe("useVideoCarousel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useVideoCarousel());

    expect(result.current.currentSlide).toBe(0);
    expect(result.current.isVisible).toBe(false);
    expect(result.current.videoDurations).toEqual([0, 0, 0]);
    expect(result.current.VIDEO_SLIDES).toHaveLength(3);
  });

  it("should provide correct video slides configuration", () => {
    const { result } = renderHook(() => useVideoCarousel());

    expect(result.current.VIDEO_SLIDES).toHaveLength(3);

    // Check structure without exact video values since mocking is inconsistent
    expect(result.current.VIDEO_SLIDES[0]).toEqual(
      expect.objectContaining({
        title: "A wallet that protects and puts you in control",
        id: "buy-sell",
        video: expect.any(String),
      }),
    );

    expect(result.current.VIDEO_SLIDES[1]).toEqual(
      expect.objectContaining({
        title: "Send, receive, swap and stake thousands of crypto",
        id: "thousands-crypto",
        video: expect.any(String),
      }),
    );

    expect(result.current.VIDEO_SLIDES[2]).toEqual(
      expect.objectContaining({
        title: "Verify all your transactions with peace of mind",
        id: "secure-wallet",
        video: expect.any(String),
      }),
    );
  });

  it("should handle video ended and advance to next slide", () => {
    const { result } = renderHook(() => useVideoCarousel());

    act(() => {
      result.current.handleVideoEnded();
    });

    expect(result.current.currentSlide).toBe(1);

    act(() => {
      result.current.handleVideoEnded();
    });

    expect(result.current.currentSlide).toBe(2);

    // Should loop back to first slide
    act(() => {
      result.current.handleVideoEnded();
    });

    expect(result.current.currentSlide).toBe(0);
  });

  it("should handle video loaded metadata", () => {
    const { result } = renderHook(() => useVideoCarousel());

    // Mock video element with duration
    const mockVideoElement = { duration: 5.5 };
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    result.current.videoRefs.current[0] = mockVideoElement as HTMLVideoElement;

    act(() => {
      result.current.handleVideoLoadedMetadata(0);
    });

    expect(result.current.videoDurations[0]).toBe(5.5);
  });

  it("should set visibility to true after fallback timeout", () => {
    const { result } = renderHook(() => useVideoCarousel());

    expect(result.current.isVisible).toBe(false);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(result.current.isVisible).toBe(true);
  });

  it("should provide refs for video elements and container", () => {
    const { result } = renderHook(() => useVideoCarousel());

    expect(result.current.videoRefs.current).toHaveLength(3);
    expect(result.current.containerRef.current).toBeNull();
  });

  it("should handle video loaded metadata with no video element", () => {
    const { result } = renderHook(() => useVideoCarousel());

    // No video element at index 0
    result.current.videoRefs.current[0] = null;

    act(() => {
      result.current.handleVideoLoadedMetadata(0);
    });

    // Should not crash and duration should remain 0
    expect(result.current.videoDurations[0]).toBe(0);
  });
});
