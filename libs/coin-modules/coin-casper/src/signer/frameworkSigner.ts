import { Transaction } from "casper-js-sdk";
import { CasperSigner } from "../types";
import { addressFromDeviceResponse, tagSignature } from "./deviceResponse";

export type CasperFrameworkSigner = {
  getAddress(
    path: string,
    // `derivationMode` is part of what the generic framework passes; Casper is secp256k1-only,
    // so there is no curve to pick from it.
    options?: { verify?: boolean; derivationMode?: string },
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(path: string, txJson: string): Promise<string>;
};

/** Adapts the device-level {@link CasperSigner} to the generic framework. secp256k1 only. */
export function createFrameworkSigner(signer: CasperSigner): CasperFrameworkSigner {
  return {
    async getAddress(path, options = {}) {
      const r = options.verify
        ? await signer.showAddressAndPubKey(path)
        : await signer.getAddressAndPubKey(path);

      const address = addressFromDeviceResponse(r);
      // The generic flow feeds this `publicKey` to `combine`, which only accepts the tagged form.
      // Casper shipped on the old bridge with seedIdentifier = raw pubkey (038c8c…, 66 chars).
      // The new format is the tagged address (02038c8c…, 68 chars). freshAddress is unchanged,
      // so sameAccountIdentity's address fallback preserves accounts on rescan, but id-keyed
      // settings (account name, etc.) reset on the first rescan after migrating.
      // config_casper_generic_bridge LiveConfig key gates this path for incident recovery (see bridge/impl.ts).
      return { path, address, publicKey: address };
    },
    async signTransaction(path, txJson) {
      // `craftTransaction` returns JSON, not the hex the framework's other families sign.
      const txBytes = Transaction.fromJSON(txJson).toBytes();
      const { signatureRS } = await signer.sign(path, Buffer.from(txBytes));
      return tagSignature(signatureRS);
    },
  };
}
