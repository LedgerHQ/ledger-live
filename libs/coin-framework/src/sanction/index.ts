import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import axios from "axios";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";

const cache = makeLRUCache(fetchSanctionedAddresses, () => "all_sanctioned_addresses", minutes(15));

async function fetchSanctionedAddresses(): Promise<Record<string, string[]>> {
  try {
    const url = getEnv("SANCTIONED_ADDRESSES_URL");
    const { data } = await axios.get(url);
    return data;
  } catch {
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

  const data: Record<string, string[]> = getEnv("MOCK")
    ? await fetchSanctionedAddresses()
    : await cache();
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
