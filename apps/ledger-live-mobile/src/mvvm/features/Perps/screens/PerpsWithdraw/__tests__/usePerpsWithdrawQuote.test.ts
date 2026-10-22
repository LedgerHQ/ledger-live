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
  expiry: 1792000000000,
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

  it("only quotes the amount the form settled on", async () => {
    const { rerender } = renderQuote(baseParams);

    rerender({ ...baseParams, amount: "600" });
    await passDebounce();

    expect(mockFetchWithdrawQuote).toHaveBeenCalledTimes(1);
    expect(mockFetchWithdrawQuote).toHaveBeenCalledWith(expect.objectContaining({ amount: "600" }));
  });
});
