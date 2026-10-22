import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "tests/testSetup";
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

function renderQuote(initialProps: PerpsWithdrawQuoteParams) {
  return renderHook((props: PerpsWithdrawQuoteParams) => usePerpsWithdrawQuote(props), {
    initialProps,
  });
}

async function passDebounce() {
  await act(() => new Promise(resolve => setTimeout(resolve, 600)));
}

describe("usePerpsWithdrawQuote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithdrawQuote.mockResolvedValue(quote);
  });

  it("quotes the amount towards the destination", async () => {
    const { result } = renderQuote(baseParams);

    await waitFor(() => expect(result.current.quote).toBe(quote), { timeout: 2000 });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetchWithdrawQuote).toHaveBeenCalledWith({
      accounts: [],
      sourceAccount,
      destinationAccount,
      amount: "500",
      counterValueCurrency: "USD",
    });
  });

  it("is loading while waiting for the quote", () => {
    const { result } = renderQuote(baseParams);

    expect(result.current.isLoading).toBe(true);
  });

  it.each([
    ["no amount", { amount: "" }],
    ["a zero amount", { amount: "0" }],
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
    expect(result.current.quote).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("only quotes the amount and destination the form settled on", async () => {
    const { rerender } = renderQuote(baseParams);

    rerender({ ...baseParams, amount: "600" });
    rerender({
      ...baseParams,
      amount: "600",
      destinationAccount: { id: "destination-2" } as AccountLike,
    });
    await passDebounce();

    expect(mockFetchWithdrawQuote).toHaveBeenCalledTimes(1);
    expect(mockFetchWithdrawQuote).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "600", destinationAccount: { id: "destination-2" } }),
    );
  });
});
