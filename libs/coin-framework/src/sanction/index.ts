import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import axios from "axios";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";

const cache = getEnv("MOCK")
  ? makeLRUCache(fetchSanctionedAddresses, () => "all_sanctioned_addresses", hours(12))
  : () => fetchSanctionedAddresses();

async function fetchSanctionedAddresses(): Promise<Record<string, string[]>> {
  try {
    const { data } = await axios.get(getEnv("SANCTIONED_ADDRESSES_URL"));
    return data;
  } catch (_) {
    // We dont want if call fails for some reason to stop the workflow, user must be able to make transaction
    return {};
  }
}

export async function isAddressSanctioned(
  currency: CryptoCurrency,
  address: string,
): Promise<boolean> {
  if (!isCheckSanctionedAddressEnabled(currency)) {
    return false;
  }

  // Only for testing, should be deleted after
  const temporarySanctionedAddress: string[] | undefined = LiveConfig.getValueByKey(
    "tmp_sanctioned_addresses",
  );

  const data: Record<string, string[]> = await cache();
  const addresses = data["bannedAddresses"] || [];

  if (temporarySanctionedAddress) {
    return addresses.concat(temporarySanctionedAddress).includes(address);
  }

  return addresses.includes(address);
}

export function isCheckSanctionedAddressEnabled(currency: CryptoCurrency): boolean {
  const currencyConfig = LiveConfig.getValueByKey(`config_currency_${currency.id}`);
  if (currencyConfig && "checkSanctionedAddress" in currencyConfig) {
    return currencyConfig.checkSanctionedAddress === true;
  } else {
    const sharedConfiguration = LiveConfig.getValueByKey("config_currency");
    if (sharedConfiguration && "checkSanctionedAddress" in sharedConfiguration) {
      return sharedConfiguration.checkSanctionedAddress === true;
    }
  }

  return false;
}
