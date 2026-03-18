import { act, renderHook } from "@tests/test-renderer";
import type { ContentCard } from "@braze/react-native-sdk";
import useDynamicContent from "./useDynamicContent";
import { flush, track } from "../analytics";

jest.mock("./brazeContentCard", () => ({
  useBrazeContentCard: jest.fn(() => ({
    logClickCard: jest.fn(),
    logDismissCard: jest.fn(),
    logImpressionCard: jest.fn(),
    refreshDynamicContent: jest.fn(),
  })),
}));

jest.mock("../analytics", () => ({
  flush: jest.fn(() => Promise.resolve()),
  track: jest.fn(() => Promise.resolve()),
}));

const mockedTrack = jest.mocked(track);
const mockedFlush = jest.mocked(flush);
const localCard: ContentCard = {
  id: "local-card",
  created: 1690112400,
  expiresAt: -1,
  viewed: false,
  clicked: false,
  pinned: false,
  dismissed: false,
  dismissible: true,
  openURLInWebView: true,
  isControl: false,
  extras: {},
  type: "Classic",
  title: "Local card",
  cardDescription: "Local test card",
};

describe("useDynamicContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should flush clicked events after tracking resolves", async () => {
    let resolveTrack: (() => void) | undefined;
    let resolveFlush: (() => void) | undefined;
    mockedTrack.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveTrack = resolve;
        }),
    );
    mockedFlush.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveFlush = resolve;
        }),
    );

    const { result } = renderHook(() => useDynamicContent());

    let trackingPromise: Promise<void> | undefined;
    act(() => {
      trackingPromise = result.current.trackContentCardEvent("contentcard_clicked", {
        campaign: "card-1",
        contentcard: "Card title",
      });
    });

    expect(mockedTrack).toHaveBeenCalledWith("contentcard_clicked", {
      campaign: "card-1",
      contentcard: "Card title",
    });
    expect(mockedFlush).not.toHaveBeenCalled();

    await act(async () => {
      resolveTrack?.();
    });

    expect(mockedFlush).toHaveBeenCalledTimes(1);
    await expect(Promise.race([trackingPromise, Promise.resolve("pending")])).resolves.toBe(
      "pending",
    );

    await act(async () => {
      resolveFlush?.();
      await trackingPromise;
    });
  });

  it("should not flush dismissed events after tracking resolves", async () => {
    let resolveTrack: (() => void) | undefined;
    mockedTrack.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveTrack = resolve;
        }),
    );

    const { result } = renderHook(() => useDynamicContent());

    let trackingPromise: Promise<void> | undefined;
    act(() => {
      trackingPromise = result.current.trackContentCardEvent("contentcard_dismissed", {
        campaign: "card-1",
        contentcard: "Card title",
      });
    });

    expect(mockedTrack).toHaveBeenCalledWith("contentcard_dismissed", {
      campaign: "card-1",
      contentcard: "Card title",
    });
    expect(mockedFlush).not.toHaveBeenCalled();

    await act(async () => {
      resolveTrack?.();
      await trackingPromise;
    });

    expect(mockedFlush).not.toHaveBeenCalled();
  });

  it("should skip tracking for local cards", async () => {
    const { result } = renderHook(() => useDynamicContent(), {
      overrideInitialState: state => ({
        ...state,
        dynamicContent: {
          ...state.dynamicContent,
          localMobileCards: [localCard],
        },
      }),
    });

    await act(async () => {
      await result.current.trackContentCardEvent("contentcard_clicked", {
        campaign: "local-card",
      });
    });

    expect(mockedTrack).not.toHaveBeenCalled();
    expect(mockedFlush).not.toHaveBeenCalled();
  });

  it("should swallow analytics errors", async () => {
    mockedTrack.mockRejectedValueOnce(new Error("track failed"));

    const { result } = renderHook(() => useDynamicContent());

    await expect(
      result.current.trackContentCardEvent("contentcard_clicked", {
        campaign: "card-1",
      }),
    ).resolves.toBeUndefined();

    expect(mockedFlush).not.toHaveBeenCalled();
  });
});
