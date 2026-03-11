import { renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useAllocationData } from "../useAllocationData";
import { AssetsDistribution } from "@ledgerhq/types-live";

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
    expect(result.current.totalCount).toBe(3);

    const btcItem = result.current.items[0];
    expect(btcItem.currency).toBe(bitcoin);
    expect(btcItem.balance).toBe(100000);
    expect(btcItem.value).toBe(60000);
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

  it("should preserve undefined countervalue", () => {
    mockUseDistribution.mockReturnValue(
      makeDistribution([{ currency: bitcoin, amount: 100000, distribution: 0.5 }]),
    );

    const { result } = renderHook(() => useAllocationData(), {
      initialState: { settings: { ...INITIAL_STATE } },
    });

    expect(result.current.items[0].value).toBeUndefined();
  });
});
