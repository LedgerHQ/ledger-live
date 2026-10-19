import { HEADER_X_LEDGER_CLIENT_VERSION, type CalApiExtra } from "@shared/api-services";
import { HEADER_X_LEDGER_COMMIT } from "./constants";
import {
  commitHeaderMissingError,
  currencyNotFoundError,
  fetchCurrencyError,
  fetchError,
} from "./errors";

/** Current CAL commit hash for one currency, or a `queryFn`-shaped error. */
export async function fetchTokensSyncHash(currencyId: string, extra: CalApiExtra) {
  try {
    const url = new URL(`${extra.calServiceUrl}/v1/currencies`);
    url.searchParams.set("output", "id");
    url.searchParams.set("limit", "1");
    url.searchParams.set("id", currencyId);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        [HEADER_X_LEDGER_CLIENT_VERSION]: extra.ledgerClientVersion,
      },
    });

    if (!response.ok) {
      return fetchCurrencyError(response.status, response.statusText);
    }

    const responseData: unknown = await response.json();
    if (Array.isArray(responseData) && responseData.length === 0) {
      return currencyNotFoundError(currencyId);
    }

    const hash = response.headers.get(HEADER_X_LEDGER_COMMIT);
    if (!hash) {
      return commitHeaderMissingError();
    }

    return { data: hash };
  } catch (error) {
    return fetchError(error);
  }
}
