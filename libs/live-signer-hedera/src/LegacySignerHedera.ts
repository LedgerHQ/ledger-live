import type { HederaSigner } from "@ledgerhq/coin-hedera/types";
import Hedera from "@ledgerhq/hw-app-hedera";
import type Transport from "@ledgerhq/hw-transport";

export class LegacySignerHedera implements HederaSigner {
  private readonly hedera: Hedera;

  constructor(transport: Transport) {
    this.hedera = new Hedera(transport);
  }

  getPublicKey(path: string): Promise<string> {
    return this.hedera.getPublicKey(path);
  }

  signTransaction(transaction: Uint8Array): Promise<Uint8Array> {
    return this.hedera.signTransaction(transaction);
  }
}
