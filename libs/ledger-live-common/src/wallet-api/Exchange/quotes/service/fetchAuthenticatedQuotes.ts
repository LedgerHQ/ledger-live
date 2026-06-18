import type { GetQuotesArgs } from "../types";
import type { ResolvedQuotesInput } from "../resolveQuotesInput";
import type { FetchQuotesResult, RawQuote, RawQuoteError } from "./types";
import { swapQuotesApi, type FetchQuotesDispatch } from "../state-manager/api";

type FetchAuthenticatedQuotesArgs = Omit<GetQuotesArgs, "data"> & {
  data: ResolvedQuotesInput;
};

function isSwapQuotesAbortError(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "name" in error && error.name === "AbortError"
  );
}

function isSwapQuotesHttpError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  );
}

export async function fetchAuthenticatedQuotes(
  args: FetchAuthenticatedQuotesArgs,
  counterValueCurrency: string,
  dispatch: FetchQuotesDispatch,
): Promise<FetchQuotesResult> {
  const { providers, data: quotesInput, headers: customHeaders, signal } = args;

  const searchParams = new URLSearchParams();
  const requiredParams: Record<string, string> = {
    amountFrom: quotesInput.amount,
    displayLanguage: "en",
    lang: "en",
    theme: "dark",
    "providers-whitelist": providers.join(","),
    fiatForCounterValue: counterValueCurrency,
    currencyTicker: counterValueCurrency,
    networkFees: "0",
    uniswapOrderType: quotesInput.uniswapOrderType ?? "classic",
    from: quotesInput.sendCurrencyId,
    to: quotesInput.receiveCurrencyId,
    fromAccountId: quotesInput.sendAccountId,
    addressFrom: quotesInput.sendAddress,
    addressTo: quotesInput.receiveAddress,
  };
  for (const [key, value] of Object.entries(requiredParams)) {
    searchParams.set(key, value);
  }

  if (quotesInput.networkFeesCurrencyId) {
    searchParams.set("networkFeesCurrency", quotesInput.networkFeesCurrencyId);
  }

  if (quotesInput.slippage != null) {
    searchParams.set("slippage", quotesInput.slippage.toString());
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(customHeaders ? Object.fromEntries(customHeaders) : {}),
  };

  const queryResult = dispatch(
    swapQuotesApi.endpoints.getSwapQuotes.initiate(
      { params: searchParams, headers: requestHeaders },
      {
        forceRefetch: true,
        subscribe: false,
      },
    ),
  );
  const abortQuery = () => queryResult.abort();

  if (signal?.aborted) {
    abortQuery();
  } else {
    signal?.addEventListener("abort", abortQuery, { once: true });
  }

  try {
    const data: Array<RawQuote | RawQuoteError> = (await queryResult.unwrap()) ?? [];
    const rawQuotes = data.filter((q): q is RawQuote => !("code" in q));
    const providerErrors = data.filter((q): q is RawQuoteError => "code" in q);

    return { rawQuotes, providerErrors };
  } catch (error) {
    if (isSwapQuotesAbortError(error)) {
      throw error;
    }

    if (isSwapQuotesHttpError(error)) {
      return { rawQuotes: [], providerErrors: [] };
    }

    throw error;
  } finally {
    signal?.removeEventListener("abort", abortQuery);
    queryResult.unsubscribe();
  }
}
