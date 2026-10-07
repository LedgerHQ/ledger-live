import Transport from "@ledgerhq/hw-transport";
import { DmkSignerCasper, LegacySignerCasper } from "@ledgerhq/live-signer-casper";
import { CreateSigner } from "../../bridge/setup";
import { isDmkTransport } from "../../hw/dmkUtils";
import { CasperSigner } from "./types";

let _casperLdmkFFEnabled: boolean = false;

export const setCasperLdmkEnabled = (enabled: boolean): void => {
  _casperLdmkFFEnabled = enabled;
};

export const createDeviceSigner: CreateSigner<CasperSigner> = (transport: Transport) => {
  if (isDmkTransport(transport) && _casperLdmkFFEnabled) {
    return new DmkSignerCasper(transport.dmk, transport.sessionId);
  }
  return new LegacySignerCasper(transport);
};
