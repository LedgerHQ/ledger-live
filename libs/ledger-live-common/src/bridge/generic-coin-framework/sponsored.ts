import { findCryptoCurrencyByNetwork } from "./utils";
import { loadSponsoredApiForFamily } from "../../coin-modules/registry";
import type { SponsoredCoinApi } from "@features/platform-send-flow/sponsored-api";

export type {
  EnergyRentStatus,
  EnergyRentRequest,
  EnergyRentOrder,
  RentOrderRejection,
  EnergyRentOrderRef,
  SponsoredFeeAsset,
  SponsoredFeeQuote,
  RentPayment,
  SponsoredCoinApi,
} from "@features/platform-send-flow/sponsored-api";

/** Null unless `kind` is "local" and the family registers a sponsored seam. Pass the network id, not a token's currency id. */
export async function getSponsoredCoinApi(
  network: string,
  kind: string,
): Promise<SponsoredCoinApi | null> {
  if (kind !== "local") return null;
  const currency = findCryptoCurrencyByNetwork(network);
  const createSponsoredApi = currency && (await loadSponsoredApiForFamily(currency.family));
  return createSponsoredApi ? createSponsoredApi(currency.id) : null;
}
