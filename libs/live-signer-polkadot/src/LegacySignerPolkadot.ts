import {
  PolkadotAddress,
  PolkadotSignature,
  PolkadotSigner,
} from "@ledgerhq/coin-polkadot/types/signer";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import Transport from "@ledgerhq/hw-transport";

export class LegacySignerPolkadot implements PolkadotSigner {
  private signer: Polkadot;

  constructor(transport: Transport) {
    this.signer = new Polkadot(transport);
  }

  getAddress(
    path: string,
    ss58prefix: number,
    showAddrInDevice?: boolean,
  ): Promise<PolkadotAddress> {
    return this.signer.getAddress(path, ss58prefix, showAddrInDevice);
  }

  sign(
    path: string,
    message: Uint8Array,
    metadata: string,
  ): Promise<PolkadotSignature> {
    return this.signer.sign(path, message, metadata);
  }
}
