import Polkadot from "@ledgerhq/hw-app-polkadot";
import Transport from "@ledgerhq/hw-transport";
import type {
  PolkadotAddress,
  PolkadotSignature,
  PolkadotSigner,
} from "@ledgerhq/coin-polkadot/types/signer";

export class LegacySignerPolkadot implements PolkadotSigner {
  private readonly signer: Polkadot;

  constructor(transport: Transport) {
    this.signer = new Polkadot(transport);
  }

  async getAddress(
    path: string,
    ss58prefix: number,
    showAddrInDevice?: boolean,
  ): Promise<PolkadotAddress> {
    return this.signer.getAddress(path, ss58prefix, showAddrInDevice);
  }

  async sign(path: string, message: Uint8Array, metadata: string): Promise<PolkadotSignature> {
    return this.signer.sign(path, message, metadata);
  }
}
