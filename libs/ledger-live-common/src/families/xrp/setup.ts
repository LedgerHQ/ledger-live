// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Transport from "@ledgerhq/hw-transport";
import { DmkSignerXrp, LegacySignerXrp } from "@ledgerhq/live-signer-xrp";
import xrpResolver from "./getAddress";
import { XrpSigner } from "./types";
import { CreateSigner, createResolver } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { isDmkTransport } from "../../hw/dmkUtils";

let _xrpLdmkFFEnabled: boolean = false;

// temporary solution to dynamically enable/disable the XRP DMK signer,
// to be removed together with useFeature("ldmkXrpSigner")
export const setXrpLdmkEnabled = (enabled: boolean): void => {
  _xrpLdmkFFEnabled = enabled;
};

export const createSigner: CreateSigner<XrpSigner> = (transport: Transport) => {
  if (isDmkTransport(transport) && _xrpLdmkFFEnabled) {
    return new DmkSignerXrp(transport.dmk, transport.sessionId);
  }
  return new LegacySignerXrp(transport);
};

const resolver: Resolver = createResolver(createSigner, xrpResolver);

export { resolver };
