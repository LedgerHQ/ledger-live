import { isUtxoBasedCurrency } from "@ledgerhq/live-e2e-shared/addressCache";
import { UTXO_ADDRESS_CACHE_FILE } from "@ledgerhq/live-e2e-shared/utxoAddressCache";
import { generateAddressCache } from "scripts/generate/addressCacheGen";
import { runGenerator } from "scripts/generate/shared";

function isUtxoCacheable(currencyId: string): boolean {
  if (currencyId.includes("/")) return false;
  return isUtxoBasedCurrency(currencyId);
}

runGenerator(({ coin, outputDir }) =>
  generateAddressCache({
    coin,
    outputDir,
    outFile: UTXO_ADDRESS_CACHE_FILE,
    isCacheable: isUtxoCacheable,
    emptyError: "no matching UTXO-based coin found",
  }),
);
