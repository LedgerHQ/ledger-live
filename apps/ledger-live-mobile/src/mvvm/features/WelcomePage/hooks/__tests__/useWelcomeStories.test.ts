import { act, renderHook } from "@tests/test-renderer";
import { useWelcomeStories } from "../useWelcomeStories";

const mockUseIsFocused = jest.fn(() => true);
const mockUseIsAppInBackground = jest.fn(() => false);

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => mockUseIsFocused(),
}));

jest.mock("~/components/useIsAppInBackground", () => ({
  __esModule: true,
  default: () => mockUseIsAppInBackground(),
}));

describe("useWelcomeStories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsFocused.mockReturnValue(true);
    mockUseIsAppInBackground.mockReturnValue(false);
  });

  it("should expose the welcome videos and initial story state", () => {
    const { result } = renderHook(() => useWelcomeStories());

    expect(result.current.welcomeVideos).toHaveLength(3);
    expect(result.current.welcomeVideos.map(video => video.id)).toEqual([
      "welcome-basic-1",
      "welcome-basic-2",
      "welcome-basic-3",
    ]);
    expect(result.current.currentVideoIndex).toBe(0);
    expect(result.current.currentStoryRestartKey).toBe(0);
    expect(result.current.videoDurations).toEqual([
      { id: "welcome-basic-1", durationMs: 0 },
      { id: "welcome-basic-2", durationMs: 0 },
      { id: "welcome-basic-3", durationMs: 0 },
    ]);
  });

  it("should stay on the first story when going previous from the first story", () => {
    const { result } = renderHook(() => useWelcomeStories());

    act(() => {
      result.current.onPrevious();
    });

    expect(result.current.currentVideoIndex).toBe(0);
  });

  it("should restart the first story when going previous from the first story", () => {
    const { result } = renderHook(() => useWelcomeStories());

    act(() => {
      result.current.onPrevious();
    });

    expect(result.current.currentStoryRestartKey).toBe(1);

    act(() => {
      result.current.onPrevious();
    });

    expect(result.current.currentVideoIndex).toBe(0);
    expect(result.current.currentStoryRestartKey).toBe(2);
  });

  it("should go to the previous story when not on the first story", () => {
    const { result } = renderHook(() => useWelcomeStories());

    act(() => {
      result.current.onNext();
    });

    expect(result.current.currentVideoIndex).toBe(1);

    act(() => {
      result.current.onPrevious();
    });

    expect(result.current.currentVideoIndex).toBe(0);
    expect(result.current.currentStoryRestartKey).toBe(0);
  });

  it("should advance to the next story and wrap from the last story", () => {
    const { result } = renderHook(() => useWelcomeStories());

    act(() => {
      result.current.onNext();
      result.current.onNext();
    });

    expect(result.current.currentVideoIndex).toBe(2);

    act(() => {
      result.current.onNext();
    });

    expect(result.current.currentVideoIndex).toBe(0);
  });

  it("should store video duration in milliseconds when a story loads", () => {
    const { result } = renderHook(() => useWelcomeStories());

    act(() => {
      result.current.onLoad(1)({ duration: 4.567 } as never);
    });

    expect(result.current.videoDurations).toEqual([
      { id: "welcome-basic-1", durationMs: 0 },
      { id: "welcome-basic-2", durationMs: 4567 },
      { id: "welcome-basic-3", durationMs: 0 },
    ]);
  });

  it("should reset to the first story when the app goes to the background", () => {
    const { result, rerender } = renderHook(() => useWelcomeStories());

    act(() => {
      result.current.onNext();
      result.current.onNext();
    });

    expect(result.current.currentVideoIndex).toBe(2);

    mockUseIsAppInBackground.mockReturnValue(true);
    rerender({});

    expect(result.current.currentVideoIndex).toBe(0);
  });

  it("should reset to the first story when the screen is re-focused", () => {
    mockUseIsFocused.mockReturnValue(false);
    const { result, rerender } = renderHook(() => useWelcomeStories());

    act(() => {
      result.current.onNext();
      result.current.onNext();
    });

    expect(result.current.currentVideoIndex).toBe(2);

    mockUseIsFocused.mockReturnValue(true);
    rerender({});

    expect(result.current.currentVideoIndex).toBe(0);
  });
});
