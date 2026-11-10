import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AnalyticsPositionSource } from "../../types";

export function getAnalyticsPositionCurrency(
  position: AnalyticsPositionSource,
): CryptoOrTokenCurrency {
  return position.type === "Account" ? position.currency : position.token;
}
