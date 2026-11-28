import { signTransaction } from "../bridge/sign";
import { decodeCrafted } from "../logic/envelope";
import type { CantonAddress, CantonSigner } from "../types/signer";

export type CantonFrameworkSigner = {
  getAddress(
    path: string,
    options?: { verify?: boolean; derivationMode?: string },
  ): Promise<CantonAddress>;
  signTransaction(path: string, craftedTransaction: string): Promise<string>;
};

/** Adapts the device-level {@link CantonSigner} to the generic framework. */
export function createFrameworkSigner(signer: CantonSigner): CantonFrameworkSigner {
  return {
    // The framework passes an options object, which would be truthy as `display`.
    getAddress: (path, options = {}) => signer.getAddress(path, options.verify ?? false),
    async signTransaction(path, craftedTransaction) {
      const { json } = decodeCrafted(craftedTransaction);
      const { signature } = await signTransaction(signer, path, json);
      return signature;
    },
  };
}
