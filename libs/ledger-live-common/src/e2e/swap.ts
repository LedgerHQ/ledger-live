import { Account } from "./enum/Account";
import { sanitizeError } from "./index";
import axios, { AxiosRequestConfig } from "axios";

// Target a sensible USD amount that works for most pairs
const FALLBACK_TARGET_USD = 50;

const COUNTERVALUES_URL = "https://countervalues.live.ledger.com/v3/spot/simple";
const SWAP_QUOTE_URL = "https://swap-stg.ledger-test.com/v5/quote";

/** Smallest amount sent to the quote API to discover minimum thresholds. */
const PROBE_AMOUNT = 0.0001;
const PROBE_NETWORK_FEES = 0.001;

const PROVIDERS_WHITELIST = "changelly_v2,exodus,thorswap,uniswap,cic_v2,nearintents";

type QuoteErrorItem = {
  parameter?: { minAmount?: string };
};

function isQuoteErrorItem(item: unknown): item is QuoteErrorItem {
  return typeof item === "object" && item !== null && "parameter" in item;
}

/**
 * Fetches the current USD price for a currency from the Ledger countervalues API
 * and converts a target USD value into the equivalent crypto amount.
 */
async function getAmountFromUSD(currencyId: string, targetUSD: number): Promise<number | null> {
  try {
    const { data } = await axios.get(COUNTERVALUES_URL, {
      params: {
        froms: currencyId,
        to: "USD",
      },
    });

    const price = data?.[currencyId];
    if (!price || price <= 0) {
      console.warn(`No USD price found for ${currencyId}`);
      return null;
    }

    return targetUSD / price;
  } catch (error: unknown) {
    console.warn(`Failed to fetch countervalue for ${currencyId}:`, sanitizeError(error));
    return null;
  }
}

export async function getMinimumSwapAmount(
  accountFrom: Account,
  accountTo: Account,
): Promise<number | null> {
  try {
    const addressFrom = accountFrom.address || accountFrom.parentAccount?.address;

    if (!addressFrom) {
      throw new Error("No address available from accounts when requesting minimum swap amount.");
    }

    const requestConfig: AxiosRequestConfig = {
      method: "GET",
      url: SWAP_QUOTE_URL,
      params: {
        from: accountFrom.currency.id,
        to: accountTo.currency.id,
        amountFrom: PROBE_AMOUNT,
        addressFrom,
        fiatForCounterValue: "USD",
        slippage: 1,
        networkFees: PROBE_NETWORK_FEES,
        networkFeesCurrency: accountTo.currency.speculosApp.name.toLowerCase(),
        displayLanguage: "en",
        theme: "light",
        "providers-whitelist": PROVIDERS_WHITELIST,
        tradeType: "INPUT",
        uniswapOrderType: "uniswapxv1",
      },
      headers: { accept: "application/json" },
    };

    const { data } = await axios(requestConfig);

    if (!Array.isArray(data)) {
      console.warn("Unexpected quote API response, falling back to countervalues");
      return await getAmountFromUSD(accountFrom.currency.id, FALLBACK_TARGET_USD);
    }

    // Try to extract minAmount from AMOUNT_OFF_LIMITS errors
    const minimumAmounts = data
      .filter(isQuoteErrorItem)
      .filter(item => item.parameter?.minAmount !== undefined)
      .map(item => Number.parseFloat(item.parameter!.minAmount!))
      .filter((amount: number) => !Number.isNaN(amount) && amount > 0);

    if (minimumAmounts.length > 0) {
      return Math.max(...minimumAmounts);
    }

    // No minAmount returned — compute a sensible fallback from countervalues
    console.warn(
      `No minAmount from quote API for ${accountFrom.currency.id} → ${accountTo.currency.id}, ` +
        `computing fallback from countervalues (~$${FALLBACK_TARGET_USD} USD)`,
    );
    return await getAmountFromUSD(accountFrom.currency.id, FALLBACK_TARGET_USD);
  } catch (error: unknown) {
    const sanitizedError = sanitizeError(error);
    console.warn("Error fetching swap minimum amount:", sanitizedError);

    // Last resort: try to compute a sensible amount even if the quote call failed entirely
    try {
      return await getAmountFromUSD(accountFrom.currency.id, FALLBACK_TARGET_USD);
    } catch {
      return null;
    }
  }
}
