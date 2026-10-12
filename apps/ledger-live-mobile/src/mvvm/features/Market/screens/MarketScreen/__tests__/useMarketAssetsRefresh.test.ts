import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import type { HashMapBody } from "@ledgerhq/live-common/market/utils/types";
import { useMarketAssetsRefresh } from "../useMarketAssetsRefresh";

const mockUseIsFocused = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => mockUseIsFocused(),
}));

const ONE_MINUTE = 60 * 1000;
const NOW = new Date("2026-10-12T10:00:00Z").getTime();

function createPageMetadata(updatedAt: number) {
  const refetch = jest.fn();
  return { updatedAt, refetch: refetch as unknown as HashMapBody["refetch"], refetchMock: refetch };
}

function createMetadataMap(entries: Record<string, ReturnType<typeof createPageMetadata>>) {
  return new Map<string, HashMapBody>(
    Object.entries(entries).map(([page, { updatedAt, refetch }]) => [page, { updatedAt, refetch }]),
  );
}

describe("useMarketAssetsRefresh", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    mockUseIsFocused.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("refetches the visible page every 3 minutes by default", () => {
    const firstPage = createPageMetadata(NOW);
    const cachedMetadataMap = createMetadataMap({ "0": firstPage });

    renderHook(() => useMarketAssetsRefresh({ cachedMetadataMap, visiblePage: 1, enabled: true }));

    act(() => jest.advanceTimersByTime(3 * ONE_MINUTE - 1));
    expect(firstPage.refetchMock).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    expect(firstPage.refetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses the llmRefreshMarketData refresh time", () => {
    const firstPage = createPageMetadata(NOW - 2 * ONE_MINUTE);
    const cachedMetadataMap = createMetadataMap({ "0": firstPage });

    renderHook(() => useMarketAssetsRefresh({ cachedMetadataMap, visiblePage: 1, enabled: true }), {
      overrideInitialState: withFlagOverrides({
        llmRefreshMarketData: { params: { refreshTime: 1 } },
      }),
    });

    act(() => jest.advanceTimersByTime(ONE_MINUTE));
    expect(firstPage.refetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to 3 minutes when the refresh time is not positive", () => {
    const firstPage = createPageMetadata(NOW - 10 * ONE_MINUTE);
    const cachedMetadataMap = createMetadataMap({ "0": firstPage });

    renderHook(() => useMarketAssetsRefresh({ cachedMetadataMap, visiblePage: 1, enabled: true }), {
      overrideInitialState: withFlagOverrides({
        llmRefreshMarketData: { params: { refreshTime: 0 } },
      }),
    });

    act(() => jest.advanceTimersByTime(ONE_MINUTE));
    expect(firstPage.refetchMock).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(2 * ONE_MINUTE));
    expect(firstPage.refetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not refetch the visible page while it is still fresh", () => {
    const firstPage = createPageMetadata(NOW);
    const cachedMetadataMap = createMetadataMap({ "0": firstPage });

    renderHook(() => useMarketAssetsRefresh({ cachedMetadataMap, visiblePage: 1, enabled: true }));

    act(() => jest.advanceTimersByTime(ONE_MINUTE));
    cachedMetadataMap.set("0", { updatedAt: Date.now(), refetch: firstPage.refetch });

    act(() => jest.advanceTimersByTime(2 * ONE_MINUTE));
    expect(firstPage.refetchMock).not.toHaveBeenCalled();
  });

  it("only refetches the visible page", () => {
    const firstPage = createPageMetadata(NOW - 10 * ONE_MINUTE);
    const secondPage = createPageMetadata(NOW - 10 * ONE_MINUTE);
    const cachedMetadataMap = createMetadataMap({ "0": firstPage, "1": secondPage });

    renderHook(() => useMarketAssetsRefresh({ cachedMetadataMap, visiblePage: 2, enabled: true }));

    act(() => jest.advanceTimersByTime(3 * ONE_MINUTE));
    expect(secondPage.refetchMock).toHaveBeenCalledTimes(1);
    expect(firstPage.refetchMock).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const firstPage = createPageMetadata(NOW - 10 * ONE_MINUTE);
    const cachedMetadataMap = createMetadataMap({ "0": firstPage });

    renderHook(() => useMarketAssetsRefresh({ cachedMetadataMap, visiblePage: 1, enabled: false }));

    act(() => jest.advanceTimersByTime(10 * ONE_MINUTE));
    expect(firstPage.refetchMock).not.toHaveBeenCalled();
  });

  it("stops refreshing once unmounted", () => {
    const firstPage = createPageMetadata(NOW - 10 * ONE_MINUTE);
    const cachedMetadataMap = createMetadataMap({ "0": firstPage });

    const { unmount } = renderHook(() =>
      useMarketAssetsRefresh({ cachedMetadataMap, visiblePage: 1, enabled: true }),
    );
    unmount();

    act(() => jest.advanceTimersByTime(10 * ONE_MINUTE));
    expect(firstPage.refetchMock).not.toHaveBeenCalled();
  });

  it("pauses while the screen is not focused and resumes on focus", () => {
    const firstPage = createPageMetadata(NOW - 10 * ONE_MINUTE);
    const cachedMetadataMap = createMetadataMap({ "0": firstPage });
    mockUseIsFocused.mockReturnValue(false);

    const { rerender } = renderHook(() =>
      useMarketAssetsRefresh({ cachedMetadataMap, visiblePage: 1, enabled: true }),
    );

    act(() => jest.advanceTimersByTime(10 * ONE_MINUTE));
    expect(firstPage.refetchMock).not.toHaveBeenCalled();

    mockUseIsFocused.mockReturnValue(true);
    rerender(undefined);

    act(() => jest.advanceTimersByTime(3 * ONE_MINUTE));
    expect(firstPage.refetchMock).toHaveBeenCalledTimes(1);
  });
});
