import { sanitizeError } from "./index";
import axios from "axios";

const COUNTERVALUES_URL = "https://countervalues.live.ledger.com/v3/spot/simple";

/**
 * Fetches the current USD price for a currency from the Ledger countervalues API
 * and converts a target USD value into the equivalent crypto amount.
 */
export async function getAmountFromUSD(
  currencyId: string,
  targetUSD: number,
): Promise<number | null> {
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
