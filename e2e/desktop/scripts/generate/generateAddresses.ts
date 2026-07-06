import { ADDRESS_CACHE_FILE, isUtxoBasedCurrency } from "@ledgerhq/live-e2e-shared/addressCache";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { generateAddressCache } from "./addressCacheGen";
import { runGenerator } from "./shared";

const NON_DERIVABLE_FAMILIES = new Set(["hedera", "concordium"]);

function isCacheable(currencyId: string): boolean {
  if (currencyId.includes("/")) return false;
  if (isUtxoBasedCurrency(currencyId)) return false;
  const family = getFamilyByCurrencyId(currencyId);
  return !(family && NON_DERIVABLE_FAMILIES.has(family));
}

runGenerator(({ coin, outputDir }) =>
  generateAddressCache({
    coin,
    outputDir,
    outFile: ADDRESS_CACHE_FILE,
    isCacheable,
    emptyError: "no matching account-based coin found",
  }),
);
