import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import axios from "axios";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";

const cache = getEnv("MOCK")
  ? makeLRUCache(fetchSanctionedAddresses, () => "all_sanctioned_addresses", hours(12))
  : () => fetchSanctionedAddresses();

async function fetchSanctionedAddresses(): Promise<Record<string, string[]>> {
  const { data } = await axios.get(
    "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
  );
  return data;
}

export async function isAddressSanctioned(
  currency: CryptoCurrency,
  address: string,
): Promise<boolean> {
  if (!isCheckBlacklistAddressEnabled(currency)) {
    return false;
  }

  // Only for testing, should be deleted after
  const temporarySanctionedAddress: string[] | undefined = LiveConfig.getValueByKey(
    "tmp_sanctioned_addresses",
  );

  const data: Record<string, string[]> = await cache();
  const addresses = data[currency.ticker] || [];

  if (temporarySanctionedAddress) {
    return addresses.concat(temporarySanctionedAddress).includes(address);
  }

  return addresses.includes(address);
}

function isCheckBlacklistAddressEnabled(currency: CryptoCurrency): boolean {
  const checkBlacklistAddress = false;
  const currencyConfig = LiveConfig.getValueByKey(`config_currency_${currency.id}`);
  if (currencyConfig && "checkBlacklistAddress" in currencyConfig) {
    return currencyConfig.checkBlacklistAddress === true;
  } else {
    const sharedConfiguration = LiveConfig.getValueByKey("config_currency");
    if (!sharedConfiguration) {
      throw new Error(
        "Shared config for currency not found, please check it exists on Firebase > RemoteConfig",
      );
    } else if ("checkBlacklistAddress" in sharedConfiguration) {
      return sharedConfiguration.checkBlacklistAddress === true;
    }
  }

  return checkBlacklistAddress;
}
