import { renderHook } from "tests/testSetup";
import { useActivityIndicatorTooltip } from "../useActivityIndicatorTooltip";

const enUsState = { settings: { locale: "en-US" } };

describe("useActivityIndicatorTooltip", () => {
  it("returns undefined when isRotating is true", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: true,
        isError: false,
        listOfErrorAccountNames: "",
        lastSyncMs: 0,
      }),
    );
    expect(result.current).toBeUndefined();
  });

  it("returns emptyErrorToolTip when isError is true and no account names", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: false,
        isError: true,
        listOfErrorAccountNames: "",
        lastSyncMs: 0,
      }),
    );
    expect(result.current).toBe(
      "There was a temporary network issue. Your assets are safe.\n Tap to retry",
    );
  });

  it("returns error tooltip with account names when isError is true", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: false,
        isError: true,
        listOfErrorAccountNames: "BTC/ETH",
        lastSyncMs: 1000,
      }),
    );
    expect(result.current).toBe(
      "There was a temporary network issue. Your assets are safe.\n List of accounts impacted: BTC/ETH. Tap to retry",
    );
  });

  it("returns upToDate when lastSyncMs is 0 or invalid", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: false,
        isError: false,
        listOfErrorAccountNames: "",
        lastSyncMs: 0,
      }),
    );
    expect(result.current).toBe("You're up to date");
  });

  it("returns upToDate when last sync is less than 1 minute ago", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: false,
        isError: false,
        listOfErrorAccountNames: "",
        lastSyncMs: Date.now() - 30 * 1000,
      }),
    );
    expect(result.current).toBe("You're up to date");
  });

  describe("with formatTimeAgo (frozen time: 2024-06-15T12:00:00Z)", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns locale-aware tooltip for minutes via formatTimeAgo", () => {
      const { result } = renderHook(
        () =>
          useActivityIndicatorTooltip({
            isRotating: false,
            isError: false,
            listOfErrorAccountNames: "",
            lastSyncMs: Date.now() - 5 * 60 * 1000,
          }),
        { initialState: enUsState },
      );
      expect(result.current).toContain("5 minutes ago");
      expect(result.current).toContain("Last sync:");
      expect(result.current).toContain("Tap to refresh");
    });

    it("returns locale-aware tooltip for hours via formatTimeAgo", () => {
      const { result } = renderHook(
        () =>
          useActivityIndicatorTooltip({
            isRotating: false,
            isError: false,
            listOfErrorAccountNames: "",
            lastSyncMs: Date.now() - 3 * 60 * 60 * 1000,
          }),
        { initialState: enUsState },
      );
      expect(result.current).toContain("3 hours ago");
      expect(result.current).toContain("Last sync:");
    });

    it("returns short date via formatTimeAgo for sync older than 7 days", () => {
      // System time: 2024-06-15, 10 days ago = 2024-06-05
      const { result } = renderHook(
        () =>
          useActivityIndicatorTooltip({
            isRotating: false,
            isError: false,
            listOfErrorAccountNames: "",
            lastSyncMs: Date.now() - 10 * 24 * 60 * 60 * 1000,
          }),
        { initialState: enUsState },
      );
      expect(result.current).toContain("Last sync:");
      expect(result.current).toContain("Jun");
    });
  });
});
