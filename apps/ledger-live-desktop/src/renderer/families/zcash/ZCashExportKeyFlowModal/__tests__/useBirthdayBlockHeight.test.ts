import { renderHook, act, waitFor } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useBirthdayBlockHeight } from "../useBirthdayBlockHeight";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/index"),
  getAccountBridge: jest.fn(),
}));
const mockedGetAccountBridge = jest.mocked(getAccountBridge);

const account = createFixtureAccount();

const mockBridge = (findBlockHeightAtDate: jest.Mock) =>
  mockedGetAccountBridge.mockReturnValue({ findBlockHeightAtDate } as never);

const sleep = (ms: number) => act(() => new Promise<void>(resolve => setTimeout(resolve, ms)));
// Lets the debounce elapse and the lookup settle.
const settle = () => sleep(500);

describe("useBirthdayBlockHeight", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("resolves the bridge's height for a valid date", async () => {
    const findBlockHeightAtDate = jest.fn().mockResolvedValue(3_428_143);
    mockBridge(findBlockHeightAtDate);

    const { result } = renderHook(() => useBirthdayBlockHeight(account, "2026-07-28", true));
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(3_428_143));

    expect(findBlockHeightAtDate).toHaveBeenCalledWith(account, "2026-07-28");
  });

  it("returns null and does not call the bridge when disabled", async () => {
    const findBlockHeightAtDate = jest.fn().mockResolvedValue(1);
    mockBridge(findBlockHeightAtDate);

    const { result } = renderHook(() => useBirthdayBlockHeight(account, "2026-07-28", false));
    await settle();

    expect(result.current).toBeNull();
    expect(findBlockHeightAtDate).not.toHaveBeenCalled();
  });

  it("returns null when the bridge rejects", async () => {
    mockBridge(jest.fn().mockRejectedValue(new Error("indexer down")));

    const { result } = renderHook(() => useBirthdayBlockHeight(account, "2026-07-28", true));
    await settle();

    expect(result.current).toBeNull();
  });

  it("returns null when the bridge has no lookup (a bridge that is not Zcash's)", async () => {
    mockedGetAccountBridge.mockReturnValue({} as never);

    const { result } = renderHook(() => useBirthdayBlockHeight(account, "2026-07-28", true));
    await settle();

    expect(result.current).toBeNull();
  });

  it("does not look anything up while the date keeps changing", async () => {
    const findBlockHeightAtDate = jest.fn().mockResolvedValue(10);
    mockBridge(findBlockHeightAtDate);

    const { rerender } = renderHook(({ date }) => useBirthdayBlockHeight(account, date, true), {
      initialProps: { date: "2026-07-01" },
    });
    await sleep(50);
    rerender({ date: "2026-07-02" });
    await settle();

    expect(findBlockHeightAtDate).toHaveBeenCalledTimes(1);
    expect(findBlockHeightAtDate).toHaveBeenCalledWith(account, "2026-07-02");
  });

  it("drops a late response for a previous date", async () => {
    let resolveFirst: (height: number) => void = () => {};
    const findBlockHeightAtDate = jest
      .fn()
      .mockImplementationOnce(() => new Promise<number>(resolve => (resolveFirst = resolve)))
      .mockResolvedValueOnce(200);
    mockBridge(findBlockHeightAtDate);

    const { result, rerender } = renderHook(
      ({ date }) => useBirthdayBlockHeight(account, date, true),
      { initialProps: { date: "2026-07-01" } },
    );
    await settle(); // first lookup is in flight
    rerender({ date: "2026-07-02" });
    await settle();
    expect(result.current).toBe(200);

    await act(async () => resolveFirst(100));

    expect(result.current).toBe(200);
  });

  it("forgets the height once the lookup is disabled", async () => {
    mockBridge(jest.fn().mockResolvedValue(5));

    const { result, rerender } = renderHook(
      ({ enabled }) => useBirthdayBlockHeight(account, "2026-07-28", enabled),
      { initialProps: { enabled: true } },
    );
    await settle();
    expect(result.current).toBe(5);

    rerender({ enabled: false });

    expect(result.current).toBeNull();
  });
});
