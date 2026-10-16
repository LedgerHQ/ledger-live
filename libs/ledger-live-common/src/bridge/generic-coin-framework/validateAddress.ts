import type { ValidateAddressFn } from "../../coin-modules/types";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { openCurrencyPortfolio } from "./networkPortfolio";
import { isPortfolioEnabledFor } from "./portfolio/config";
import { findCryptoCurrencyByNetwork } from "./utils";

/**
 * Validates an address with the coin module of the currency (`parameters.currencyId`, else the
 * network): through its portfolio when its coin config enables it, which validates on the side
 * writing for the chain, with the network id when one is given.
 */
export function genericValidateAddress(network: string, kind: string): ValidateAddressFn {
  return async (address, parameters) => {
    const currencyId = parameters.currencyId ?? network;
    const currency = findCryptoCurrencyByNetwork(currencyId);
    if (currency && isPortfolioEnabledFor(currency.id)) {
      const { portfolio, network: served } = await openCurrencyPortfolio(currency, "write");
      const { networkId } = parameters;
      const { valid } = await portfolio.validateAddress(
        served,
        address,
        ...(networkId === undefined ? [] : [{ networkId }]),
      );
      return valid;
    }
    const api = await getCoinModuleApi(currencyId, kind);
    return api.validateAddress(buildContext(currencyId), address, parameters);
  };
}
