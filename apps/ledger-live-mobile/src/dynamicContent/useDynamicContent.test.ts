import { act, renderHook } from "@tests/test-renderer";
import type { ContentCard } from "@braze/react-native-sdk";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
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
    mockedTrack.mockResolvedValue(undefined);
    mockedFlush.mockResolvedValue(undefined);
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
      trackingPromise = result.current.trackContentCardEvent(ContentCardEvent.Clicked, {
        campaign: "card-1",
        contentcard: "Card title",
      });
    });

    expect(mockedTrack).toHaveBeenCalledWith(ContentCardEvent.Clicked, {
      campaign: "card-1",
      contentcard: "Card title",
    });
    expect(mockedFlush).not.toHaveBeenCalled();

    await act(async () => {
      resolveTrack?.();
      await Promise.resolve();
    });

    expect(mockedFlush).toHaveBeenCalledTimes(1);

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
      trackingPromise = result.current.trackContentCardEvent(ContentCardEvent.Dismissed, {
        campaign: "card-1",
        contentcard: "Card title",
      });
    });

    expect(mockedTrack).toHaveBeenCalledWith(ContentCardEvent.Dismissed, {
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

  it("should track local cards through Segment", async () => {
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
      await result.current.trackContentCardEvent(ContentCardEvent.Clicked, {
        campaign: "local-card",
      });
    });

    expect(mockedTrack).toHaveBeenCalledWith(ContentCardEvent.Clicked, {
      campaign: "local-card",
    });
    expect(mockedFlush).toHaveBeenCalledTimes(1);
  });

  it("should strip non-numeric displayedPosition before tracking", async () => {
    const { result } = renderHook(() => useDynamicContent());

    await act(async () => {
      await result.current.trackContentCardEvent(ContentCardEvent.Clicked, {
        campaign: "card-1",
        displayedPosition: "invalid",
      });
    });

    expect(mockedTrack).toHaveBeenCalledWith(ContentCardEvent.Clicked, {
      campaign: "card-1",
    });
  });

  it("should swallow analytics errors", async () => {
    mockedTrack.mockRejectedValueOnce(new Error("track failed"));

    const { result } = renderHook(() => useDynamicContent());

    await expect(
      result.current.trackContentCardEvent(ContentCardEvent.Clicked, {
        campaign: "card-1",
      }),
    ).resolves.toBeUndefined();

    expect(mockedFlush).not.toHaveBeenCalled();
  });
});
