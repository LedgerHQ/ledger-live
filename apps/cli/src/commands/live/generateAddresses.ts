import { ADDRESS_CACHE_FILE, isUtxoBasedCurrency } from "@ledgerhq/live-e2e-shared/addressCache";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import {
  addressCacheArgs,
  generateAddressCache,
  type GenerateAddressesJobOpts,
} from "../../addressCacheGen";

const NON_DERIVABLE_FAMILIES = new Set(["hedera", "concordium"]);

function isCacheable(currencyId: string): boolean {
  if (currencyId.includes("/")) return false;
  if (isUtxoBasedCurrency(currencyId)) return false;
  const family = getFamilyByCurrencyId(currencyId);
  return !(family && NON_DERIVABLE_FAMILIES.has(family));
}

export default {
  description:
    "Generate the E2E address cache (addresses.json) for account-based coins, launching Speculos automatically. UTXO-based coins are skipped on purpose; generate them with generateUtxoAddresses.",
  args: addressCacheArgs,
  job: ({ coin, outputDir }: GenerateAddressesJobOpts) =>
    generateAddressCache({
      coin,
      outputDir,
      outFile: ADDRESS_CACHE_FILE,
      isCacheable,
      emptyError: "no matching account-based coin found",
    }),
};
