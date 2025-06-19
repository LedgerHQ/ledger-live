import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import axios from "axios";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import { v4 as uuid } from "uuid";
import { OperationType } from "@ledgerhq/types-live";

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
  const addresses = data[currency.ticker] || [];

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

export async function reportSanctionedTransaction(properties: {
  addressFrom: string;
  addressTo: string;
  amount: string;
  currency: string;
  transactionType: OperationType | "SWAP";
  sanctionedAddresses: string;
}): Promise<void> {
  console.warn("Reporting sanctioned transaction:", properties); // TODO: remove this line
  const url = "https://logs.ledger-test.com/";
  const payload = {
    ddsource: "LedgerLive",
    ddtags: "env:stagging,service:swap,bu:wallet-services",
    message: "transaction banned",
    status: "warn",
    hostname: "proxy",
    service: "LedgerLive",
    additionalProperties: {
      ...properties,
      reference: uuid(),
      transactionType: mapToOperationCategory(properties.transactionType),
      timestamp: new Date().toUTCString(),
    },
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error sending log:", error);
  }
}

type OFACTransactionType = "Send" | "Receive" | "Swap" | "Earn" | undefined;

function mapToOperationCategory(type: OperationType | "SWAP"): OFACTransactionType {
  if (!type) return undefined;
  const receiveTypes = ["IN", "NFT_IN"];
  const sendTypes = ["OUT", "NFT_OUT", "BURN", "FEES", "APPROVE", "OPT_OUT", "REVEAL", "CREATE"];
  const earnTypes = [
    "DELEGATE",
    "UNDELEGATE",
    "REDELEGATE",
    "REWARD",
    "FREEZE",
    "UNFREEZE",
    "WITHDRAW_EXPIRE_UNFREEZE",
    "UNDELEGATE_RESOURCE",
    "LEGACY_UNFREEZE",
    "VOTE",
    "REWARD_PAYOUT",
    "BOND",
    "UNBOND",
    "WITHDRAW_UNBONDED",
    "SET_CONTROLLER",
    "SLASH",
    "NOMINATE",
    "CHILL",
    "OPT_IN",
    "LOCK",
    "UNLOCK",
    "WITHDRAW",
    "REVOKE",
    "ACTIVATE",
    "REGISTER",
    "STAKE",
    "UNSTAKE",
    "WITHDRAW_UNSTAKED",
  ];
  const swapTypes = ["SWAP"];

  if (receiveTypes.includes(type)) return "Receive";
  if (sendTypes.includes(type)) return "Send";
  if (earnTypes.includes(type)) return "Earn";
  if (swapTypes.includes(type)) return "Swap";

  return undefined;
}
