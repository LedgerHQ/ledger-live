import type { ValidateAddressFn } from "../../coin-modules/types";
import { getCoinModuleApi } from "./api";

export function genericValidateAddress(network: string, kind: string): ValidateAddressFn {
  return async (address, parameters) => {
    const currencyId = parameters.currencyId ?? network;
    const api = await getCoinModuleApi(currencyId, kind);
    return api.validateAddress(address, parameters);
  };
}
