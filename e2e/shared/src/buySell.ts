import { getAmountFromUSD } from "./currencyUtils";
import { sanitizeError } from "./index";
import axios, { AxiosRequestConfig } from "axios";

const BUY_SELL_BASE_URL = "https://buy.api.aws.prd.ldg-tech.com";
const SELL_CRYPTO_LIMITATION_ENDPOINT = "/sell/v1/cryptoLimitations";
const FALLBACK_TARGET_USD = 10;

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
