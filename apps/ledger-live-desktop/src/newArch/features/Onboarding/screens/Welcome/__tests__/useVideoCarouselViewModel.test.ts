/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useVideoCarouselViewModel } from "../useVideoCarouselViewModel";

// Mock video files
jest.mock("../assets/ledgerWalletBuySell.webm", () => "mock-buy-sell.webm");
jest.mock("../assets/ledgerWalletThousandsCrypto.webm", () => "mock-thousands-crypto.webm");
jest.mock("../assets/ledgerWalletSecureWallet.webm", () => "mock-secure-wallet.webm");

// Mock translation
const mockT = jest.fn((key: string) => key);
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockT }),
}));

describe("useVideoCarouselViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useVideoCarouselViewModel());

    expect(result.current.currentSlide).toBe(0);
    expect(result.current.isVisible).toBe(false);
    expect(result.current.videoDurations).toEqual([0, 0, 0]);
    expect(result.current.VIDEO_SLIDES).toHaveLength(3);
  });

  it("should provide correct video slides configuration", () => {
    const { result } = renderHook(() => useVideoCarouselViewModel());

    expect(result.current.VIDEO_SLIDES[0]).toEqual({
      video: "mock-buy-sell.webm",
      title: "onboarding.screens.welcome.videos.buySell",
      id: "buy-sell",
    });

    expect(result.current.VIDEO_SLIDES[1]).toEqual({
      video: "mock-thousands-crypto.webm",
      title: "onboarding.screens.welcome.videos.thousandsCrypto",
      id: "thousands-crypto",
    });

    expect(result.current.VIDEO_SLIDES[2]).toEqual({
      video: "mock-secure-wallet.webm",
      title: "onboarding.screens.welcome.videos.secureWallet",
      id: "secure-wallet",
    });
  });

  it("should handle video ended and advance to next slide", () => {
    const { result } = renderHook(() => useVideoCarouselViewModel());

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
    const { result } = renderHook(() => useVideoCarouselViewModel());

    // Mock video element with duration
    const mockVideoElement = { duration: 5.5 };
    result.current.videoRefs.current[0] = mockVideoElement as HTMLVideoElement;

    act(() => {
      result.current.handleVideoLoadedMetadata(0);
    });

    expect(result.current.videoDurations[0]).toBe(5.5);
  });

  it("should set visibility to true after fallback timeout", () => {
    const { result } = renderHook(() => useVideoCarouselViewModel());

    expect(result.current.isVisible).toBe(false);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(result.current.isVisible).toBe(true);
  });

  it("should provide refs for video elements and container", () => {
    const { result } = renderHook(() => useVideoCarouselViewModel());

    expect(result.current.videoRefs.current).toHaveLength(3);
    expect(result.current.containerRef.current).toBeNull();
  });

  it("should handle video loaded metadata with no video element", () => {
    const { result } = renderHook(() => useVideoCarouselViewModel());

    // No video element at index 0
    result.current.videoRefs.current[0] = null;

    act(() => {
      result.current.handleVideoLoadedMetadata(0);
    });

    // Should not crash and duration should remain 0
    expect(result.current.videoDurations[0]).toBe(0);
  });
});
