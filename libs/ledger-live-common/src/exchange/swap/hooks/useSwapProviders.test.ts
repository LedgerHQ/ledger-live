import { renderHook } from "@testing-library/react-hooks";
import { useSwapProviders } from "./useSwapProviders";
import { getProviders } from "..";

jest.mock("..");

const mockedGetProviders = jest.mocked(getProviders);

describe("useSwapProviders", () => {
  const OLD_ENV = process.env;
  const mockedProviders = [
    {
      provider: "changelly",
      pairs: [
        { from: "ETH", to: "BTC", tradeMethod: "fixed" },
        { from: "DOT", to: "BTC", tradeMethod: "fixed" },
        { from: "EGLD", to: "BTC", tradeMethod: "float" },
        { from: "LINK", to: "ETH", tradeMethod: "fixed" },
        { from: "LINK", to: "GRT", tradeMethod: "float" },
      ],
    },
    {
      provider: "wyre",
      pairs: [
        { from: "ETH", to: "BTC", tradeMethod: "fixed" },
        { from: "BTC", to: "ETH", tradeMethod: "float" },
      ],
    },
  ];

  beforeEach(() => {
    mockedGetProviders.mockResolvedValue(mockedProviders);
    // Clear the cache
    jest.resetModules();
    // Copy envs already present before running this test to process.env
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    mockedGetProviders.mockClear();
  });

  afterAll(() => {
    // Restore the old envs
    process.env = OLD_ENV;
  });

  test("returns the initial state on mount", () => {
    const { result, unmount } = renderHook(() => useSwapProviders());

    // interrupt the useEffect function by unmounting the component
    unmount();

    expect(result.current.isLoading).toBeTruthy();
    expect(result.current.error).toBeNull();
    expect(result.current.providers).toBeNull();
    // automatically fired on mount
    expect(mockedGetProviders).toHaveBeenCalledTimes(1);
  });

  test("returns the fetched providers", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSwapProviders());

    await waitForNextUpdate();

    expect(mockedGetProviders).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBeFalsy();
    expect(result.current.error).toBeNull();
    expect(result.current.providers).toEqual(mockedProviders);
  });

  test("only returns no-filtered fetched providers", async () => {
    // set the SWAP_DISABLED_PROVIDERS env variable for this test
    process.env.SWAP_DISABLED_PROVIDERS = "wyre";
    const { result, waitForNextUpdate } = renderHook(() => useSwapProviders());

    await waitForNextUpdate();

    expect(mockedGetProviders).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBeFalsy();
    expect(result.current.error).toBeNull();
    expect(result.current.providers).toEqual(
      mockedProviders.filter((provider) => provider.provider !== "wyre")
    );
  });

  test("returns the fetched error", async () => {
    const error = new Error("test error");
    mockedGetProviders.mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useSwapProviders());

    await waitForNextUpdate();

    expect(mockedGetProviders).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBeFalsy();
    expect(result.current.error).toEqual(error);
    expect(result.current.providers).toBeNull();
  });

  test("only fetch providers on mount", async () => {
    const { rerender, waitForNextUpdate } = renderHook(() =>
      useSwapProviders()
    );

    await waitForNextUpdate();
    rerender();

    expect(mockedGetProviders).toHaveBeenCalledTimes(1);
  });
});
