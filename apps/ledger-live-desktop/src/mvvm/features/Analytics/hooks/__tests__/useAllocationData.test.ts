import { renderHook, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useAllocationData } from "../useAllocationData";
import { AssetsDistribution } from "@ledgerhq/types-live";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockedUseNavigate = jest.mocked(useNavigate);

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const solana = getCryptoCurrencyById("solana");

const mockUseDistribution = jest.fn();

jest.mock("~/renderer/actions/general", () => ({
  useDistribution: (...args: unknown[]) => mockUseDistribution(...args),
}));

function makeDistribution(
  items: {
    currency: typeof bitcoin;
    amount: number;
    distribution: number;
    countervalue?: number;
  }[],
): AssetsDistribution {
  return {
    isAvailable: true,
    list: items.map(i => ({
      currency: i.currency,
      amount: i.amount,
      distribution: i.distribution,
      countervalue: i.countervalue,
      accounts: [],
    })),
    showFirst: 6,
    sum: items.reduce((acc, i) => acc + (i.countervalue ?? 0), 0),
  };
}

describe("useAllocationData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockUseDistribution.mockReturnValue(
      makeDistribution([
        { currency: bitcoin, amount: 100000, distribution: 0.6, countervalue: 60000 },
        { currency: ethereum, amount: 50000, distribution: 0.3, countervalue: 30000 },
        { currency: solana, amount: 10000, distribution: 0.1, countervalue: 10000 },
      ]),
    );
  });

  it("should transform distribution items to AllocationTableItem format", () => {
    const { result } = renderHook(() => useAllocationData(), {
      initialState: { settings: { ...INITIAL_STATE } },
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.hasMore).toBe(false);

    const btcItem = result.current.items[0];
    expect(btcItem.currency).toBe(bitcoin);
    expect(btcItem.balance).toBe(100000);
  });

  it("should floor distribution percentage to two decimal places", () => {
    mockUseDistribution.mockReturnValue(
      makeDistribution([
        { currency: bitcoin, amount: 100000, distribution: 0.33339, countervalue: 33339 },
      ]),
    );

    const { result } = renderHook(() => useAllocationData(), {
      initialState: { settings: { ...INITIAL_STATE } },
    });

    expect(result.current.items[0].distribution).toBe(33.33);
  });

  it("should default to 0 when distribution is undefined", () => {
    mockUseDistribution.mockReturnValue({
      isAvailable: true,
      list: [
        {
          currency: bitcoin,
          amount: 100,
          distribution: undefined,
          countervalue: 100,
          accounts: [],
        },
      ],
      showFirst: 6,
      sum: 100,
    });

    const { result } = renderHook(() => useAllocationData(), {
      initialState: { settings: { ...INITIAL_STATE } },
    });

    expect(result.current.items[0].distribution).toBe(0);
  });

  it("should filter out blacklisted tokens", () => {
    const { result } = renderHook(() => useAllocationData(), {
      initialState: {
        settings: { ...INITIAL_STATE, blacklistedTokenIds: ["ethereum"] },
      },
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find(i => i.currency.id === "ethereum")).toBeUndefined();
  });

  it("should pass hideEmptyTokenAccount setting to useDistribution", () => {
    renderHook(() => useAllocationData(), {
      initialState: {
        settings: { ...INITIAL_STATE, hideEmptyTokenAccounts: true },
      },
    });

    expect(mockUseDistribution).toHaveBeenCalledWith({ hideEmptyTokenAccount: true });
  });

  it("should show at most 6 items initially and expose hasMore when there are more", () => {
    const currencies = [bitcoin, ethereum, solana, bitcoin, ethereum, solana, bitcoin, ethereum];
    mockUseDistribution.mockReturnValue(
      makeDistribution(
        currencies.map((c, i) => ({ currency: c, amount: 1000 * (i + 1), distribution: 0.1 })),
      ),
    );

    const { result } = renderHook(() => useAllocationData(), {
      initialState: { settings: { ...INITIAL_STATE } },
    });

    expect(result.current.items).toHaveLength(6);
    expect(result.current.hasMore).toBe(true);
  });

  it("should load the next page when showMore is called", () => {
    const currencies = [bitcoin, ethereum, solana, bitcoin, ethereum, solana, bitcoin, ethereum];
    mockUseDistribution.mockReturnValue(
      makeDistribution(
        currencies.map((c, i) => ({ currency: c, amount: 1000 * (i + 1), distribution: 0.1 })),
      ),
    );

    const { result } = renderHook(() => useAllocationData(), {
      initialState: { settings: { ...INITIAL_STATE } },
    });

    act(() => {
      result.current.showMore();
    });

    expect(result.current.items).toHaveLength(8);
    expect(result.current.hasMore).toBe(false);
  });

  it("should navigate to /asset/{id} when onItemClick is called", () => {
    const { result } = renderHook(() => useAllocationData(), {
      initialState: { settings: { ...INITIAL_STATE } },
    });

    act(() => {
      result.current.onItemClick(result.current.items[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/asset/bitcoin");
  });
});
