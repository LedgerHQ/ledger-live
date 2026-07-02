import { act } from "react";
import { renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { lastBlock } from "@ledgerhq/live-common/families/aleo/logic";
import { useAleoLiveBlockHeight } from "./useAleoLiveBlockHeight";
import { LIVE_BLOCK_HEIGHT_POLL_MS } from "../constants";

jest.mock("@ledgerhq/live-common/families/aleo/logic", () => ({
  lastBlock: jest.fn(),
}));

const mockLastBlock = lastBlock as jest.MockedFunction<typeof lastBlock>;
const currency = getCryptoCurrencyById("aleo");

const blockAt = (height: number) => ({
  height,
  hash: `hash-${height}`,
  time: new Date(0),
});

/** Flush pending microtasks (resolved promises) inside an act() boundary. */
const flush = () => act(async () => {});

describe("useAleoLiveBlockHeight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the fallback height until a live value is fetched", () => {
    mockLastBlock.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() =>
      useAleoLiveBlockHeight(currency, { fallbackHeight: 100, enabled: true }),
    );
    expect(result.current).toBe(100);
  });

  it("does not poll when disabled", () => {
    renderHook(() => useAleoLiveBlockHeight(currency, { fallbackHeight: 100, enabled: false }));
    expect(mockLastBlock).not.toHaveBeenCalled();
  });

  it("fetches immediately and updates to the live height", async () => {
    mockLastBlock.mockResolvedValue(blockAt(150));
    const { result } = renderHook(() =>
      useAleoLiveBlockHeight(currency, { fallbackHeight: 100, enabled: true }),
    );
    expect(mockLastBlock).toHaveBeenCalledTimes(1);
    await flush();
    expect(result.current).toBe(150);
  });

  it("polls again after the interval elapses", async () => {
    mockLastBlock.mockResolvedValueOnce(blockAt(150)).mockResolvedValueOnce(blockAt(151));
    const { result } = renderHook(() =>
      useAleoLiveBlockHeight(currency, { fallbackHeight: 100, enabled: true }),
    );
    await flush();
    expect(result.current).toBe(150);

    await act(async () => {
      jest.advanceTimersByTime(LIVE_BLOCK_HEIGHT_POLL_MS);
    });
    expect(result.current).toBe(151);
    expect(mockLastBlock).toHaveBeenCalledTimes(2);
  });

  it("never returns a value below the fallback height", async () => {
    mockLastBlock.mockResolvedValue(blockAt(90));
    const { result } = renderHook(() =>
      useAleoLiveBlockHeight(currency, { fallbackHeight: 100, enabled: true }),
    );
    await flush();
    expect(result.current).toBe(100);
  });

  it("keeps the last good value when a fetch rejects", async () => {
    mockLastBlock.mockResolvedValueOnce(blockAt(150)).mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() =>
      useAleoLiveBlockHeight(currency, { fallbackHeight: 100, enabled: true }),
    );
    await flush();
    expect(result.current).toBe(150);

    await act(async () => {
      jest.advanceTimersByTime(LIVE_BLOCK_HEIGHT_POLL_MS);
    });
    // No throw, value unchanged.
    expect(result.current).toBe(150);
  });
});
