/*
 * Crypto Asset List Service
 *
 * Use only exposed methods below outside of this module.
 */

import { getCertificate } from "./certificate";
import { findCurrencyData } from "./currencies";
import { getProvidersCDNData, getProvidersData } from "./partners";

export type { CurrencyData } from "./currencies";
export type { PartnerType, ExchangeProvider } from "./partners";
export type { AdditionalProviderConfig } from "./partners/default";

export { SWAP_DATA_CDN } from "./partners/default";

export default {
  findCurrencyData,
  getCertificate,
  getProvidersCDNData,
  getProvidersData,
};
