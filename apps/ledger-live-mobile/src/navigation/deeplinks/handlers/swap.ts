import { getStateFromPath } from "@react-navigation/native";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://swap`
 *
 * Remaps legacy param names (fromToken → fromTokenId, etc.) and
 * forwards the normalised path to React Navigation.
 */
export const swapHandler: DeeplinkHandler = ({ searchParams }, { config }) => {
  const swapParams = new URLSearchParams();
  const fromPath = searchParams.get("fromPath");
  const fromToken = searchParams.get("fromToken");
  const toToken = searchParams.get("toToken");
  const amountFrom = searchParams.get("amountFrom");
  const affiliate = searchParams.get("affiliate");
  const fromCurrency = searchParams.get("fromCurrency");
  const toCurrency = searchParams.get("toCurrency");

  if (fromPath) swapParams.set("fromPath", fromPath);
  if (fromToken) swapParams.set("fromTokenId", fromToken);
  if (toToken) swapParams.set("toTokenId", toToken);
  if (fromCurrency) swapParams.set("fromCurrencyId", fromCurrency);
  if (toCurrency) swapParams.set("toCurrencyId", toCurrency);
  if (amountFrom) swapParams.set("amountFrom", amountFrom);
  if (affiliate) swapParams.set("affiliate", affiliate);

  const swapSearch = swapParams.toString();
  const pathWithParams = swapSearch ? `swap?${swapSearch}` : "swap";
  return getStateFromPath(pathWithParams, config);
};
