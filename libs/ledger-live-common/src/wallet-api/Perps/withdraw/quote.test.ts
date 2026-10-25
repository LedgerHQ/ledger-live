import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { setWalletApiIdForAccountId } from "../../converters";
import { fetchQuotes } from "../../Exchange/quotes/service/fetchQuotes";
import type { FetchQuotesResult } from "../../Exchange/quotes/service/types";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";
import { WithdrawApiError, WithdrawLowLiquidityError, WithdrawMinimumAmountError } from "./errors";
import { mayanWithdrawPayload } from "./__fixtures__/responses";
import { fetchPerpsWithdrawQuote, PERPS_WITHDRAW_QUOTE_TTL_MS } from "./quote";

jest.mock("../../Exchange/quotes/service/fetchQuotes");

const mockedFetchQuotes = jest.mocked(fetchQuotes);
const NOW = 1_790_000_000_000;

const sourceAccount = {
  type: "Account",
  id: "js:2:hypercore:0xsource:",
  currency: { id: "hypercore" },
  freshAddress: "0xsource",
} as unknown as Account;

const destinationAccount = {
  type: "Account",
  id: "js:2:ethereum:0xdestination:",
  currency: { id: "ethereum" },
  freshAddress: "0xdestination",
} as unknown as Account;

const accounts: AccountLike[] = [sourceAccount, destinationAccount];

const request = {
  accounts,
  sourceAccount,
  destinationAccount,
  amount: "500",
  counterValueCurrency: "USD",
};

type RawQuote = FetchQuotesResult["rawQuotes"][number];
type RawQuoteError = FetchQuotesResult["providerErrors"][number];

const rawQuote = {
  amountTo: 0.3,
  quoteId: "quote-1",
  payoutNetworkFees: { value: 0.0004, currency: "ethereum" },
} as unknown as RawQuote;

const providerError = (code: string, parameter: Record<string, string> = {}) =>
  ({
    code,
    parameter,
    message: code,
    provider: PERPS_SWAPKIT_PROVIDER,
    type: "float",
  }) as RawQuoteError;

describe("fetchPerpsWithdrawQuote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: NOW });
    accounts.forEach(account => setWalletApiIdForAccountId(account.id));
  });

  afterEach(() => jest.useRealTimers());

  it("quotes the USDC amount from the HyperCore account to the destination through SwapKit", async () => {
    mockedFetchQuotes.mockResolvedValue({ rawQuotes: [rawQuote], providerErrors: [] });

    await fetchPerpsWithdrawQuote(request);

    expect(mockedFetchQuotes).toHaveBeenCalledWith(
      {
        providers: [PERPS_SWAPKIT_PROVIDER],
        data: expect.objectContaining({
          amount: "500",
          sendAddress: "0xsource",
          receiveAddress: "0xdestination",
          sendCurrencyId: "hypercore",
          receiveCurrencyId: "ethereum",
        }),
      },
      "USD",
    );
  });

  it("returns the amount received, the payout network fees and when to refresh", async () => {
    mockedFetchQuotes.mockResolvedValue({ rawQuotes: [rawQuote], providerErrors: [] });

    await expect(fetchPerpsWithdrawQuote(request)).resolves.toEqual({
      quoteId: "quote-1",
      amountTo: new BigNumber("0.3"),
      payoutNetworkFees: new BigNumber("0.0004"),
      expiry: NOW + PERPS_WITHDRAW_QUOTE_TTL_MS,
    });
  });

  it("treats missing payout network fees as zero", async () => {
    mockedFetchQuotes.mockResolvedValue({
      rawQuotes: [{ ...rawQuote, payoutNetworkFees: undefined }],
      providerErrors: [],
    });

    const quote = await fetchPerpsWithdrawQuote(request);

    expect(quote.payoutNetworkFees).toEqual(new BigNumber(0));
  });

  it.each([
    ["amount_off_limits", { minAmount: "5" }],
    ["amount_off_limits", { minAmount: "5", maxAmount: "100" }],
    ["FROM_CURRENCY_MINIMUM_AMOUNT_ERROR", { minAmount: "5" }],
  ])("maps %s %o below the minimum to a minimum amount error", async (code, parameter) => {
    mockedFetchQuotes.mockResolvedValue({
      rawQuotes: [],
      providerErrors: [providerError(code, parameter)],
    });

    const error = await fetchPerpsWithdrawQuote({ ...request, amount: "2" }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(WithdrawMinimumAmountError);
    expect(error).toMatchObject({ minAmount: new BigNumber(5) });
  });

  it("does not report an amount above the maximum as too low when both bounds are returned", async () => {
    mockedFetchQuotes.mockResolvedValue({
      rawQuotes: [],
      providerErrors: [providerError("amount_off_limits", { minAmount: "5", maxAmount: "100" })],
    });

    const error = await fetchPerpsWithdrawQuote({ ...request, amount: "200" }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(WithdrawApiError);
    expect(error).not.toBeInstanceOf(WithdrawMinimumAmountError);
  });

  it("does not report an amount above the maximum as too low", async () => {
    mockedFetchQuotes.mockResolvedValue({
      rawQuotes: [],
      providerErrors: [providerError("amount_off_limits", { maxAmount: "100000" })],
    });

    const error = await fetchPerpsWithdrawQuote(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(WithdrawApiError);
    expect(error).not.toBeInstanceOf(WithdrawMinimumAmountError);
  });

  it("maps a provider low-liquidity error", async () => {
    mockedFetchQuotes.mockResolvedValue({
      rawQuotes: [],
      providerErrors: [providerError("SWAP_QUOTE_LOW_LIQUIDITY")],
    });

    await expect(fetchPerpsWithdrawQuote(request)).rejects.toBeInstanceOf(
      WithdrawLowLiquidityError,
    );
  });

  it("fails when the provider returns neither a quote nor an error", async () => {
    mockedFetchQuotes.mockResolvedValue({ rawQuotes: [], providerErrors: [] });

    await expect(fetchPerpsWithdrawQuote(request)).rejects.toBeInstanceOf(WithdrawApiError);
  });

  it("fails without calling the provider when the accounts cannot be resolved", async () => {
    await expect(fetchPerpsWithdrawQuote({ ...request, accounts: [] })).rejects.toBeInstanceOf(
      WithdrawApiError,
    );
    expect(mockedFetchQuotes).not.toHaveBeenCalled();
  });

  it("keeps the withdraw payload to sign from the quote's custom fields", async () => {
    const payload = mayanWithdrawPayload;
    mockedFetchQuotes.mockResolvedValue({
      rawQuotes: [{ ...rawQuote, customFields: payload } as unknown as RawQuote],
      providerErrors: [],
    });

    const quote = await fetchPerpsWithdrawQuote(request);

    expect(quote.payload).toEqual({ swapId: payload.swapId, typedData: payload.typedData });
  });

  it("has no payload when the quote carries no typed data", async () => {
    mockedFetchQuotes.mockResolvedValue({ rawQuotes: [rawQuote], providerErrors: [] });

    const quote = await fetchPerpsWithdrawQuote(request);

    expect(quote.payload).toBeUndefined();
  });
});
