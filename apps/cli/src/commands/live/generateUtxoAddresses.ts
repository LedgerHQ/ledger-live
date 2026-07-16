import { isUtxoBasedCurrency } from "@ledgerhq/live-e2e-shared/addressCache";
import { UTXO_ADDRESS_CACHE_FILE } from "@ledgerhq/live-e2e-shared/utxoAddressCache";
import {
  addressCacheArgs,
  generateAddressCache,
  type GenerateAddressesJobOpts,
} from "../../addressCacheGen";

function isUtxoCacheable(currencyId: string): boolean {
  if (currencyId.includes("/")) return false;
  return isUtxoBasedCurrency(currencyId);
}

export default {
  description:
    "Generate the E2E UTXO address cache (utxoAddresses.json) for UTXO-based coins (bitcoin family, Cardano, Kaspa), launching Speculos automatically. Each address is the deterministic CLI getAddress result at the account's fixed derivation path. Account-based coins are skipped; generate them with generateAddresses.",
  args: addressCacheArgs,
  job: ({ coin, outputDir }: GenerateAddressesJobOpts) =>
    generateAddressCache({
      coin,
      outputDir,
      outFile: UTXO_ADDRESS_CACHE_FILE,
      isCacheable: isUtxoCacheable,
      emptyError: "no matching UTXO-based coin found",
    }),
};
