import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { WithdrawLowLiquidityError } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import { usePerpsWithdrawQuote, type PerpsWithdrawQuoteParams } from "../usePerpsWithdrawQuote";

const mockFetchWithdrawQuote = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/quote", () => ({
  fetchPerpsWithdrawQuote: (params: unknown) => mockFetchWithdrawQuote(params),
}));

const quote = {
  quoteId: "quote-1",
  amountTo: new BigNumber("0.3"),
  payoutNetworkFees: new BigNumber("0.0004"),
  expiry: Date.now() + 60_000,
};

const sourceAccount = { id: "source-1" } as AccountLike;
const destinationAccount = { id: "destination-1" } as AccountLike;

const baseParams: PerpsWithdrawQuoteParams = {
  amount: "500",
  sourceAccount,
  destinationAccount,
  accounts: [],
  counterValueCurrency: "USD",
};

const renderQuote = (initialProps: PerpsWithdrawQuoteParams) =>
  renderHook((props: PerpsWithdrawQuoteParams) => usePerpsWithdrawQuote(props), { initialProps });

// Mobile tests run on fake timers.
async function passDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
}

describe("usePerpsWithdrawQuote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithdrawQuote.mockResolvedValue(quote);
  });

  it("quotes the amount towards the destination", async () => {
    const { result } = renderQuote(baseParams);

    await waitFor(() => expect(result.current.quote).toBe(quote), { timeout: 2000 });
    expect(mockFetchWithdrawQuote).toHaveBeenCalledWith({
      accounts: [],
      sourceAccount,
      destinationAccount,
      amount: "500",
      counterValueCurrency: "USD",
    });
  });

  it.each([
    ["no amount", { amount: "" }],
    ["no destination", { destinationAccount: undefined }],
  ])("stays idle with %s", async (_, overrides) => {
    const { result } = renderQuote({ ...baseParams, ...overrides });

    await passDebounce();
    expect(mockFetchWithdrawQuote).not.toHaveBeenCalled();
    expect(result.current).toEqual({ quote: undefined, isLoading: false, error: null });
  });

  it("returns the provider error", async () => {
    const error = new WithdrawLowLiquidityError("low liquidity");
    mockFetchWithdrawQuote.mockRejectedValue(error);
    const { result } = renderQuote(baseParams);

    await waitFor(() => expect(result.current.error).toBe(error), { timeout: 2000 });
  });

  it("refreshes an expired quote with unchanged inputs, dropping it while refreshing", async () => {
    const refreshed = { ...quote, quoteId: "quote-2" };
    mockFetchWithdrawQuote
      .mockImplementationOnce(() => Promise.resolve({ ...quote, expiry: Date.now() + 1_000 }))
      .mockResolvedValueOnce(refreshed);
    const { result } = renderQuote(baseParams);

    await passDebounce();
    expect(result.current.quote?.quoteId).toBe("quote-1");

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current).toEqual({ quote: undefined, isLoading: true, error: null });

    await passDebounce();
    expect(result.current.quote).toBe(refreshed);
    expect(mockFetchWithdrawQuote).toHaveBeenCalledTimes(2);
  });

  it("stops refreshing once unmounted", async () => {
    mockFetchWithdrawQuote.mockImplementation(() =>
      Promise.resolve({ ...quote, expiry: Date.now() + 100 }),
    );
    const { unmount } = renderQuote(baseParams);

    await passDebounce();
    unmount();
    await passDebounce();
    await passDebounce();

    expect(mockFetchWithdrawQuote).toHaveBeenCalledTimes(1);
  });

  it("only quotes the amount the form settled on", async () => {
    const { rerender } = renderQuote(baseParams);

    rerender({ ...baseParams, amount: "600" });
    await passDebounce();

    expect(mockFetchWithdrawQuote).toHaveBeenCalledTimes(1);
    expect(mockFetchWithdrawQuote).toHaveBeenCalledWith(expect.objectContaining({ amount: "600" }));
  });
});
