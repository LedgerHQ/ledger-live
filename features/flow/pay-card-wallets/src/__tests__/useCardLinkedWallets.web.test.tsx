import { renderHook } from "@testing-library/react";
import { useCardLinkedWallets } from "../hooks/useCardLinkedWallets";
import { CryptoOrTokenCurrencySchema } from "@domain/entity-currency";

const mockGetCardLinkedWallets = jest.fn();
const mockGetInternalWallets = jest.fn();

jest.mock("@domain/api-card-management", () => ({
  useGetCardLinkedWalletsQuery: (...args: unknown[]) => mockGetCardLinkedWallets(...args),
  useGetInternalWalletsQuery: (...args: unknown[]) => mockGetInternalWallets(...args),
}));

const internalWallets = [
  { id: "w-usdc", balance: "125.40", currency: "usdc", address: "0xusdc" },
  { id: "w-usdt", balance: "10.00", currency: "usdt", address: "0xusdt" },
];

const linkedWallets = [
  {
    id: "w-usdt",
    address: "0xusdt",
    currency: "usdt",
    network: "ethereum",
    priority: 2,
    ledgerId: "ethereum/erc20/usd_tether__erc20_",
  },
  {
    id: "w-usdc",
    address: "0xusdc",
    currency: "usdc",
    network: "ethereum",
    priority: 1,
    ledgerId: "ethereum/erc20/usd__coin",
  },
];

const currencies = new Map(
  ["ethereum/erc20/usd__coin", "ethereum/erc20/usd_tether__erc20_"].map(id => [
    id,
    CryptoOrTokenCurrencySchema.parse({
      type: "TokenCurrency",
      id,
      parentCurrencyId: "ethereum",
      contractAddress: "0x0000000000000000000000000000000000000000",
      tokenType: "erc20",
      name: id,
      ticker: "TKN",
      units: [{ name: id, code: "TKN", magnitude: 6 }],
    }),
  ]),
);

type QueryStub = Readonly<{
  data?: unknown;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  refetch?: () => void;
}>;

function stubQueries(linked: QueryStub, internal: QueryStub) {
  const linkedRefetch = jest.fn();
  const internalRefetch = jest.fn();

  // A fresh object per call: a shared one would make the stability assertions below pass for free.
  mockGetCardLinkedWallets.mockImplementation(() => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: linkedRefetch,
    ...linked,
  }));
  mockGetInternalWallets.mockImplementation(() => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: internalRefetch,
    ...internal,
  }));

  return { linkedRefetch, internalRefetch };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useCardLinkedWallets", () => {
  it("joins both reads into wallets in charging order", () => {
    stubQueries({ data: linkedWallets }, { data: internalWallets });

    const { result } = renderHook(() => useCardLinkedWallets({ currencies }));

    expect(result.current.wallets.map(({ id }) => id)).toEqual(["w-usdc", "w-usdt"]);
  });

  it("subscribes to both endpoints, and skips neither by default", () => {
    stubQueries({ data: linkedWallets }, { data: internalWallets });

    renderHook(() => useCardLinkedWallets({ currencies }));

    expect(mockGetCardLinkedWallets).toHaveBeenCalledWith(undefined, { skip: false });
    expect(mockGetInternalWallets).toHaveBeenCalledWith(undefined, { skip: false });
  });

  it("passes skip through to both, so a signed-out host provokes no 401", () => {
    stubQueries({}, {});

    const { result } = renderHook(() => useCardLinkedWallets({ currencies, skip: true }));

    expect(mockGetCardLinkedWallets).toHaveBeenCalledWith(undefined, { skip: true });
    expect(mockGetInternalWallets).toHaveBeenCalledWith(undefined, { skip: true });
    expect(result.current.wallets).toEqual([]);
  });

  it("reads as loading while either read is in flight", () => {
    stubQueries({ isLoading: true }, { data: internalWallets });

    const { result } = renderHook(() => useCardLinkedWallets({ currencies }));

    expect(result.current.isLoading).toBe(true);
  });

  it("reads as failed when either read failed", () => {
    stubQueries({ data: linkedWallets }, { isError: true });

    const { result } = renderHook(() => useCardLinkedWallets({ currencies }));

    expect(result.current.isError).toBe(true);
  });

  it("joins on whatever has arrived: a link whose balances are still in flight reads as null", () => {
    stubQueries({ data: linkedWallets }, { isLoading: true });

    const { result } = renderHook(() => useCardLinkedWallets({ currencies }));

    expect(result.current.wallets).toHaveLength(2);
    expect(result.current.wallets.every(({ balance }) => balance === null)).toBe(true);
  });

  it("refetches both endpoints", () => {
    const { linkedRefetch, internalRefetch } = stubQueries(
      { data: linkedWallets },
      { data: internalWallets },
    );

    const { result } = renderHook(() => useCardLinkedWallets({ currencies }));
    result.current.refetch();

    expect(linkedRefetch).toHaveBeenCalledTimes(1);
    expect(internalRefetch).toHaveBeenCalledTimes(1);
  });

  it("does not refetch while skipped, so a pull-to-refresh cannot undo it", () => {
    const { linkedRefetch, internalRefetch } = stubQueries({}, {});

    const { result } = renderHook(() => useCardLinkedWallets({ currencies, skip: true }));
    result.current.refetch();

    expect(linkedRefetch).not.toHaveBeenCalled();
    expect(internalRefetch).not.toHaveBeenCalled();
  });

  it("keeps refetch stable across renders, so consumers memoizing on it are not rebuilt", () => {
    stubQueries({ data: linkedWallets }, { data: internalWallets });

    const { result, rerender } = renderHook(() => useCardLinkedWallets({ currencies }));
    const first = result.current.refetch;
    rerender();

    expect(result.current.refetch).toBe(first);
  });

  it("keeps the whole result stable across renders when nothing changed", () => {
    stubQueries({ data: linkedWallets }, { data: internalWallets });

    const { result, rerender } = renderHook(() => useCardLinkedWallets({ currencies }));
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
    expect(result.current.wallets).toBe(first.wallets);
  });

  it("reports a refetch through isFetching, leaving isLoading to the first load", () => {
    stubQueries(
      { data: linkedWallets, isFetching: true },
      { data: internalWallets, isFetching: false },
    );

    const { result } = renderHook(() => useCardLinkedWallets({ currencies }));

    expect(result.current.isFetching).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});
