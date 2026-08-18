import type { ValidateAddressFn } from "../../coin-modules/types";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";

export function genericValidateAddress(network: string, kind: string): ValidateAddressFn {
  return async (address, parameters) => {
    const currencyId = parameters.currencyId ?? network;
    const api = await getCoinModuleApi(currencyId, kind);
    return api.validateAddress(buildContext(currencyId), address, parameters);
  };
}
