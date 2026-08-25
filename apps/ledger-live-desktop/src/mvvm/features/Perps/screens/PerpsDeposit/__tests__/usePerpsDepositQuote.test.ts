import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "tests/testSetup";
import { usePerpsDepositQuote, type PerpsDepositQuoteState } from "../usePerpsDepositQuote";

const mockFetchPerpsDepositQuote = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/depositQuote", () => ({
  fetchPerpsDepositQuote: (params: unknown) => mockFetchPerpsDepositQuote(params),
}));

const receiverAccount = { id: "receiver-1" } as AccountLike;
const depositAccount = { id: "funding-1" } as AccountLike;

type QuoteProps = { amount: string; depositAccount: AccountLike | undefined };

function renderQuote(initialProps: QuoteProps) {
  const seen: PerpsDepositQuoteState[] = [];
  const view = renderHook(
    (props: QuoteProps) => {
      const state = usePerpsDepositQuote({ ...props, receiverAccount });
      seen.push(state);
      return state;
    },
    { initialProps },
  );

  return { ...view, seen };
}

/** Outlasts the debounce the hook waits out before reaching the provider. */
async function passDebounce() {
  await act(() => new Promise(resolve => setTimeout(resolve, 600)));
}

describe("usePerpsDepositQuote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchPerpsDepositQuote.mockResolvedValue({
      amountTo: new BigNumber("19.75"),
      quoteId: "quote-1",
    });
  });

  it("returns the amount the provider quotes for the funding pair", async () => {
    const { result } = renderQuote({ amount: "2000", depositAccount });

    await waitFor(() => expect(result.current.quote?.amountTo.toString()).toBe("19.75"), {
      timeout: 2000,
    });
    expect(result.current.quote?.quoteId).toBe("quote-1");
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchPerpsDepositQuote).toHaveBeenCalledWith(
      expect.objectContaining({ depositAccount, receiverAccount, amount: "2000" }),
    );
  });

  it("reports no route for the pair as unavailable", async () => {
    mockFetchPerpsDepositQuote.mockResolvedValue(undefined);
    const { result } = renderQuote({ amount: "2000", depositAccount });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 2000 });
    expect(result.current.quote).toBeUndefined();
    expect(result.current.isUnavailable).toBe(true);
  });

  it("reports a failed provider request as unavailable", async () => {
    mockFetchPerpsDepositQuote.mockRejectedValue(new Error("network down"));
    const { result } = renderQuote({ amount: "2000", depositAccount });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 2000 });
    expect(result.current.quote).toBeUndefined();
    expect(result.current.isUnavailable).toBe(true);
  });

  it("only quotes the amount the form settled on", async () => {
    const { rerender } = renderQuote({ amount: "2000", depositAccount });

    rerender({ amount: "3000", depositAccount });
    await passDebounce();

    expect(mockFetchPerpsDepositQuote).toHaveBeenCalledTimes(1);
    expect(mockFetchPerpsDepositQuote).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "3000" }),
    );
  });

  it("quotes nothing without an amount or a funding account", async () => {
    const { result } = renderQuote({ amount: "", depositAccount });
    renderQuote({ amount: "2000", depositAccount: undefined });

    await passDebounce();

    expect(mockFetchPerpsDepositQuote).not.toHaveBeenCalled();
    // Nothing to quote is idle: neither pending nor a provider outage.
    expect(result.current).toEqual({ quote: undefined, isLoading: false, isUnavailable: false });
  });

  it("drops the quoted amount in the very render the amount changes", async () => {
    const { result, rerender, seen } = renderQuote({ amount: "2000", depositAccount });

    await waitFor(() => expect(result.current.quote).toBeDefined(), { timeout: 2000 });
    seen.length = 0;
    rerender({ amount: "3000", depositAccount });

    // The review reads the quote during render, so $2000 must not still be
    // quotable in the render that asks for $3000.
    expect(seen[0]).toEqual({ quote: undefined, isLoading: true, isUnavailable: false });
    expect(result.current.quote).toBeUndefined();
  });

  it("keeps the quote when the funding account is only refreshed", async () => {
    const { result, rerender } = renderQuote({ amount: "2000", depositAccount });

    await waitFor(() => expect(result.current.quote).toBeDefined(), { timeout: 2000 });
    // A background sync hands back the same account as a new object.
    rerender({ amount: "2000", depositAccount: { ...depositAccount } });
    await passDebounce();

    expect(result.current.quote?.quoteId).toBe("quote-1");
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchPerpsDepositQuote).toHaveBeenCalledTimes(1);
  });

  it("drops the quoted amount when the funding account changes", async () => {
    const { result, rerender, seen } = renderQuote({ amount: "2000", depositAccount });

    await waitFor(() => expect(result.current.quote).toBeDefined(), { timeout: 2000 });
    seen.length = 0;
    rerender({ amount: "2000", depositAccount: { id: "funding-2" } as AccountLike });

    expect(seen[0]?.quote).toBeUndefined();
  });
});
