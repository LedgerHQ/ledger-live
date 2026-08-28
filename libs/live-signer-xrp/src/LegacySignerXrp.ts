import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import type { XrpAddress, XrpSignature, XrpSigner } from "./types";

export class LegacySignerXrp implements XrpSigner {
  private readonly signer: Xrp;

  constructor(transport: Transport) {
    this.signer = new Xrp(transport);
  }

  async getAddress(
    path: string,
    display?: boolean,
    chainCode?: boolean,
    ed25519?: boolean,
  ): Promise<XrpAddress> {
    return this.signer.getAddress(path, display, chainCode, ed25519);
  }

  async signTransaction(path: string, rawTxHex: string, ed25519?: boolean): Promise<XrpSignature> {
    return this.signer.signTransaction(path, rawTxHex, ed25519);
  }
}
