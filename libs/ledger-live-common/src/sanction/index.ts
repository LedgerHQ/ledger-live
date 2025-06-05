import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import axios from "axios";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfiguration, getSharedConfiguration } from "../config";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

const cache = makeLRUCache(fetchSanctionedAddresses, () => "all_sanctioned_addresses", hours(12));

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
  const temporarySanctionedAddresses: string[] | undefined =
    LiveConfig.getValueByKey(`tmp_sanctioned_addresses`);

  const data: Record<string, string[]> = await cache();
  const addresses = data[currency.ticker] || [];

  if (temporarySanctionedAddresses) {
    return addresses.concat(temporarySanctionedAddresses).includes(address);
  }

  return addresses.includes(address);
}

function isCheckBlacklistAddressEnabled(currency: CryptoCurrency): boolean {
  const currencyConfig = tryGetCurrencyConfig(currency);
  if (currencyConfig && "checkBlacklistAddress" in currencyConfig) {
    return currencyConfig.checkBlacklistAddress === true;
  } else {
    const sharedConfiguration = getSharedConfiguration();
    if ("checkBlacklistAddress" in sharedConfiguration) {
      return sharedConfiguration.checkBlacklistAddress === true;
    }
  }

  return false;
}

function tryGetCurrencyConfig(currency: CryptoCurrency): CurrencyConfig | undefined {
  try {
    return getCurrencyConfiguration(currency);
  } catch (error) {
    return undefined;
  }
}
