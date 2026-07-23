import { getAmountFromUSD } from "./currencyUtils";
import { sanitizeError } from "./index";
import { BuySellProvider } from "./enum/Provider";
import axios, { AxiosRequestConfig } from "axios";

const BUY_SELL_BASE_URL = "https://buy.api.aws.prd.ldg-tech.com";
const SELL_CRYPTO_LIMITATION_ENDPOINT = "/sell/v1/cryptoLimitations";
const FALLBACK_TARGET_USD = 10;

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONDAY_EPOCH_UTC_MS = Date.UTC(2024, 0, 1);

type CryptoLimitation = {
  min: string;
  maxOfMin: string;
  minOfMax: string;
  maxOfMax: string;
};

type CryptoLimitationsResponse = {
  value?: Record<string, CryptoLimitation>;
};

export async function getMinimumSellAmount(currencyId: string): Promise<string> {
  const amount = await fetchMinimumSellAmount(currencyId);
  if (amount === null) {
    throw new Error(`Could not determine minimum sell amount for "${currencyId}"`);
  }
  const factor = 10 ** 6;
  const roundedUp = Math.ceil((amount - Number.EPSILON) * factor) / factor;
  return roundedUp.toString();
}

/**
 * Deterministic weekly rotation over the tested providers, restricted to the
 * ones actually offered in the quotes. Same week + same availability picks the
 * same provider (reproducible reruns) and coverage rotates weekly. Mirrors
 * swap's `pickRotatingProvider` (walks forward past unavailable providers).
 * `BUYSELL_PROVIDER` (uiName or name) forces a provider when it is available.
 */
export function pickRotatingProvider(availableUiNames: string[]): BuySellProvider {
  const available = new Set(
    availableUiNames
      .map(uiName => BuySellProvider.getByUiName(uiName))
      .filter((p): p is BuySellProvider => Boolean(p?.isTested))
      .map(p => p.name),
  );
  if (available.size === 0) {
    throw new Error(
      `No known tested providers in quotes. UI listed: ${availableUiNames.join(", ") || "(none)"}`,
    );
  }

  const eligible = Object.values(BuySellProvider).filter(
    (p): p is BuySellProvider => p instanceof BuySellProvider && p.isTested,
  );

  const override = process.env.BUYSELL_PROVIDER;
  if (override) {
    const match = eligible.find(
      p => (p.uiName === override || p.name === override) && available.has(p.name),
    );
    if (!match) {
      throw new Error(`❌ BUYSELL_PROVIDER="${override}" is not an available tested provider`);
    }
    return match;
  }

  const weekIndex = Math.floor((Date.now() - MONDAY_EPOCH_UTC_MS) / ONE_WEEK_MS);
  const scheduledIndex = weekIndex % eligible.length;
  for (let offset = 0; offset < eligible.length; offset++) {
    const candidate = eligible[(scheduledIndex + offset) % eligible.length];
    if (available.has(candidate.name)) return candidate;
  }
  throw new Error("No available tested provider found in quotes");
}

async function fetchMinimumSellAmount(currencyId: string): Promise<number | null> {
  try {
    const requestConfig: AxiosRequestConfig = {
      method: "GET",
      url: BUY_SELL_BASE_URL + SELL_CRYPTO_LIMITATION_ENDPOINT,
      headers: { accept: "application/json" },
    };

    const { data } = await axios<CryptoLimitationsResponse>(requestConfig);

    const rawMaxOfMin = data?.value?.[currencyId]?.maxOfMin;
    const maxOfMin = rawMaxOfMin !== undefined ? Number.parseFloat(rawMaxOfMin) : Number.NaN;

    if (!Number.isNaN(maxOfMin) && maxOfMin > 0) {
      return maxOfMin;
    }

    console.warn(
      `No sell limitation found for "${currencyId}", ` +
        `computing fallback from countervalues (~$${FALLBACK_TARGET_USD} USD)`,
    );
    return await getAmountFromUSD(currencyId, FALLBACK_TARGET_USD);
  } catch (error: unknown) {
    const sanitizedError = sanitizeError(error);
    console.warn("Error fetching sell minimum amount:", sanitizedError);

    // Last resort: try to compute a sensible amount even if the limitations call failed entirely.
    try {
      return await getAmountFromUSD(currencyId, FALLBACK_TARGET_USD);
    } catch {
      return null;
    }
  }
}
