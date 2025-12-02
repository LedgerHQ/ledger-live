import type Transport from "@ledgerhq/hw-transport";

export type ConcordiumAddress = {
  publicKey: string;
  address: string;
};

export type ConcordiumSignature = string; // `0x${string}`

/**
 * Concordium App API
 */
export default class Concordium {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "concordium_default_scramble_key") {
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getAddress", "signTransaction"], scrambleKey);
  }

  async getAddress(_path: string): Promise<ConcordiumAddress> {
    return { publicKey: "", address: "" };
  }

  async signTransaction(_path: string, _rawTx: string): Promise<ConcordiumSignature> {
    return "0x";
  }
}
