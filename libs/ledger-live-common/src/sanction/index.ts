import { LedgerAPI4xx, NetworkType } from "@ledgerhq/errors";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import axios, { AxiosError } from "axios";
import { log } from "console";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";

const cache = makeLRUCache(fetchSanctionedAddresses, (ticker: string) => ticker, hours(12));

async function fetchSanctionedAddresses(ticker: string): Promise<string[]> {
  const { data } = await axios.get(
    `https://ofac-compliance.pages.dev/sanctioned_addresses_${ticker.toUpperCase()}.json`,
  );
  return data;
}

export async function isAddressSanctioned(ticker: string, address: string): Promise<boolean> {
  // Only for testing, should be deleted after
  const temporarySanctionedAddress: string[] | undefined = LiveConfig.getValueByKey(
    `tmp_sanctioned_addresses_${ticker}`,
  );

  try {
    const data = await cache(ticker);

    if (temporarySanctionedAddress) {
      return data.concat(temporarySanctionedAddress).includes(address);
    }

    return data.includes(address);
  } catch (error) {
    if (
      (axios.isAxiosError(error) && (error as AxiosError).status === 404) ||
      (error instanceof LedgerAPI4xx && (error as unknown as NetworkType).status === 404)
    ) {
      if (temporarySanctionedAddress) {
        return temporarySanctionedAddress.includes(address);
      }

      return false;
    }

    throw error;
  }
}

export type BlacklistAddressLog = {
  recipient?: string;
  user: string;
  amount: string;
};

export function sendLog(payload: BlacklistAddressLog) {
  log("Log to be sent to Datadog: ", payload);
}
