// Goal of this file is to inject all necessary device/signer dependency to coin-modules
import Transport from "@ledgerhq/hw-transport";
import { DmkSignerTron, LegacySignerTron } from "@ledgerhq/live-signer-tron";
import tronResolver from "./getAddress";
import type { TronSigner } from "./types";
import { type Resolver } from "../../hw/getAddress/types";
import { type CreateSigner, createResolver } from "../../bridge/setup";
import { isDmkTransport } from "../../hw/dmkUtils";

let _tronLdmkFFEnabled: boolean = false;

// temporary solution to dynamically enable/disable the Tron DMK signer,
// to be removed together with useFeature("ldmkTronSigner")
export const setTronLdmkEnabled = (enabled: boolean): void => {
  _tronLdmkFFEnabled = enabled;
};

/**
 * Picks the device signer. The DMK path needs both a DMK transport and the flag, so a build
 * running on the DMK transport keeps signing through `hw-app-trx` until `ldmkTronSigner` is on.
 */
export const createSigner: CreateSigner<TronSigner> = (transport: Transport) => {
  if (isDmkTransport(transport) && _tronLdmkFFEnabled) {
    return new DmkSignerTron(transport.dmk, transport.sessionId);
  }
  return new LegacySignerTron(transport);
};

// No `bridge` export: Tron runs on the generic coin framework, which builds the account bridge from
// the Coin Module API (`coinModuleApi.ts`) plus the family hooks registered in
// `coin-modules/loaders.ts`. Only address resolution still needs a family-specific entry point.
const resolver: Resolver = createResolver(createSigner, tronResolver);

export { resolver };
