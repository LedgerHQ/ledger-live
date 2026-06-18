import { Account } from "./enum/Account";
import { sanitizeError } from "./index";
import axios, { AxiosRequestConfig } from "axios";
import { SwapProvider } from "./enum/Provider";
import { getAmountFromUSD } from "./currencyUtils";

// Target a sensible USD amount that works for most pairs
const FALLBACK_TARGET_USD = 50;

const SWAP_QUOTE_URL = "https://swap-stg.ledger-test.com/v5/quote";

/** Smallest amount sent to the quote API to discover minimum thresholds. */
const PROBE_AMOUNT = 0.0001;
const PROBE_NETWORK_FEES = 0.001;

const PROVIDERS_WHITELIST =
  "changelly_v2,exodus,thorswap,uniswap,cic_v2,nearintents,swapsxyz,moonpay_trade";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = ONE_DAY_MS * 7;
const MONDAY_EPOCH_UTC_MS = Date.UTC(2024, 0, 1);

type QuoteErrorItem = {
  parameter?: { minAmount?: string };
};

type SwapQuoteItem = {
  provider?: string;
  amountTo?: number;
  code?: string;
};

function isQuoteErrorItem(item: unknown): item is QuoteErrorItem {
  return typeof item === "object" && item !== null && "parameter" in item;
}

export async function getMinimumSwapAmount(
  accountFrom: Account,
  accountTo: Account,
  providersWhitelist?: string[],
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
        "providers-whitelist": providersWhitelist?.join(",") ?? PROVIDERS_WHITELIST,
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

/** Usable = the provider returned a real amount and no error code. */
function isUsableQuote(q: SwapQuoteItem): boolean {
  return q.code === undefined && Number(q.amountTo) > 0;
}

async function keepRunningProviders(
  eligibleProviders: SwapProvider[],
  accountFrom: Account,
  accountTo: Account,
): Promise<SwapProvider[]> {
  const addressFrom = accountFrom.address || accountFrom.parentAccount?.address;
  if (!addressFrom) {
    console.warn("No address available from accounts when checking provider health.");
    return eligibleProviders;
  }

  const amountFrom = await getMinimumSwapAmount(
    accountFrom,
    accountTo,
    eligibleProviders.map(p => p.name),
  );
  if (amountFrom == null) {
    return eligibleProviders;
  }

  try {
    const requestConfig: AxiosRequestConfig = {
      method: "GET",
      url: SWAP_QUOTE_URL,
      timeout: 10_000,
      params: {
        from: accountFrom.currency.id,
        to: accountTo.currency.id,
        amountFrom,
        addressFrom,
        fiatForCounterValue: "USD",
        slippage: 1,
        networkFees: PROBE_NETWORK_FEES,
        networkFeesCurrency: accountTo.currency.speculosApp.name.toLowerCase(),
        displayLanguage: "en",
        theme: "light",
        "providers-whitelist": eligibleProviders.map(p => p.name).join(","),
        tradeType: "INPUT",
        uniswapOrderType: "uniswapxv1",
      },
      headers: { accept: "application/json" },
    };

    const { data } = await axios(requestConfig);
    if (!Array.isArray(data)) {
      console.warn(
        "Unexpected quote API response while checking provider health; keeping full providers list.",
      );
      return eligibleProviders;
    }
    const healthyNames = data.filter(isUsableQuote).map(item => item.provider);
    return eligibleProviders.filter(p => healthyNames.includes(p.name));
  } catch (error: unknown) {
    console.warn("Error checking swap provider health:", sanitizeError(error));
    return eligibleProviders;
  }
}

export async function pickRotatingProvider(
  eligibleProviders: SwapProvider[],
  accountFrom: Account,
  accountTo: Account,
): Promise<SwapProvider> {
  if (eligibleProviders.length === 0) {
    throw new Error("[Providers Health Check] - eligibleProviders is empty");
  }

  const runningProviders = await keepRunningProviders(eligibleProviders, accountFrom, accountTo);
  if (runningProviders.length === 0) {
    throw new Error(
      `[Providers Health Check] - no running swap provider for ` +
        `${accountFrom.currency.name} → ${accountTo.currency.name}`,
    );
  }
  // Explicit override always wins, matched against the healthy set so forcing a
  // down provider fails loudly instead of silently testing nothing.
  const override = process.env.SWAP_PROVIDER;
  if (override) {
    const match = runningProviders.find(p => p.uiName === override || p.name === override);
    if (!match) {
      throw new Error(
        `[Providers Health Check] - ❌ "${override}" did not match any of the healthy providers: ` +
          runningProviders.map(p => `${p.uiName} (or ${p.name})`).join(", "),
      );
    }
    return match;
  }
  const dropped = eligibleProviders.filter(p => !runningProviders.includes(p));
  if (dropped.length > 0) {
    console.warn(
      `[Providers Health Check] - Some quotes are down for ${accountFrom.currency.name} → ` +
        `${accountTo.currency.name}: ❌${dropped.map(p => p.name.toUpperCase()).join(", ❌")}`,
    );
  }
  // Deterministic weekly slot over the eligible list; walk forward to the next
  // healthy provider only when the scheduled one(s) is down.
  const isRunning = runningProviders.map(p => p.name);
  const weekIndex = Math.floor((Date.now() - MONDAY_EPOCH_UTC_MS) / ONE_WEEK_MS);
  const scheduledIndex = weekIndex % eligibleProviders.length;
  for (let offset = 0; offset < eligibleProviders.length; offset++) {
    const candidate = eligibleProviders[(scheduledIndex + offset) % eligibleProviders.length];
    if (isRunning.includes(candidate.name)) {
      if (offset > 0) {
        console.warn(
          `[Providers Health Check] - ❌ Scheduled provider "${eligibleProviders[scheduledIndex].name}" ` +
            `is down; using "${candidate.name}" instead`,
        );
      }
      return candidate;
    }
  }
  throw new Error(
    `[Providers Health Check] - No healthy provider found for ` +
      `${accountFrom.currency.name} → ${accountTo.currency.name}`,
  );
}
