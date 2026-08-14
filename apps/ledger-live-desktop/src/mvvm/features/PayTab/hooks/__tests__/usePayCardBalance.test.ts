import { act, renderHook, waitFor } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { usePayCardBalance } from "../usePayCardBalance";
import type { PayStablecoins } from "../usePayStablecoins";
import { usePayStablecoins } from "../usePayStablecoins";
import { USDC, USDT, makeItem } from "./fixtures";

jest.mock("../usePayStablecoins", () => ({ usePayStablecoins: jest.fn() }));

const mockedUsePayStablecoins = jest.mocked(usePayStablecoins);
const mockedTrack = jest.mocked(track);

const initialState = { settings: { ...AFTER_ONBOARDING_STATE, counterValue: "USD" } };

function mockStablecoins(overrides: Partial<PayStablecoins> = {}) {
  mockedUsePayStablecoins.mockReturnValue({
    stablecoins: [],
    defaultStablecoins: [USDC, USDT],
    isLoading: false,
    isError: false,
    ...overrides,
  });
}

describe("usePayCardBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStablecoins();
  });

  it("should wire the portfolio and formatters into the aggregated balance", () => {
    mockStablecoins({
      stablecoins: [
        makeItem("ethereum/erc20/usd__coin", "USDC", "USDC", 1000),
        makeItem("ethereum/erc20/usd_tether__erc20_", "USDT", "USDT", 250.5),
      ],
    });

    const { result } = renderHook(() => usePayCardBalance(), { initialState });

    expect(result.current.stableBalance).toBe(1250.5);
    expect(result.current.status).toBe("ready");
    expect(result.current.hasBalance).toBe(true);
    expect(result.current.filter).toBe("all");
    expect(result.current.filterOptions[0].id).toBe("all");
  });

  it("should heal a stale persisted filter back to all", async () => {
    const { result, store } = renderHook(() => usePayCardBalance(), {
      initialState: { ...initialState, payCard: { balanceFilter: "ethereum/erc20/gone" } },
    });

    expect(result.current.filter).toBe("all");
    await waitFor(() => expect(store.getState().payCard.balanceFilter).toBe("all"));
  });

  it("should persist the confirmed filter", async () => {
    const { result, store } = renderHook(() => usePayCardBalance(), { initialState });

    act(() => result.current.onConfirmFilter(USDC.id));

    await waitFor(() => expect(store.getState().payCard.balanceFilter).toBe(USDC.id));
  });

  it("should forward tracking events to analytics", () => {
    const { result } = renderHook(() => usePayCardBalance(), { initialState });

    act(() => result.current.onTrackEvent?.("button_clicked", { button: "balance_filter" }));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", { button: "balance_filter" });
  });
});
