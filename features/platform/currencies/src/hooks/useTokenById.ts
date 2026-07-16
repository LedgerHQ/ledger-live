import { useFindTokenByIdQuery } from "@domain/api-currency-token";

/**
 * Looks up a CAL token by its id via RTK-Query. Skips the request when no id is
 * given. Returns the RTK-Query result (`data`/`isLoading`/`error`/…).
 */
export function useTokenById(id: string | undefined) {
  return useFindTokenByIdQuery({ id: id ?? "" }, { skip: !id });
}
