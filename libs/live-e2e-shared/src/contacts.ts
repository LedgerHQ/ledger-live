import { randomUUID } from "node:crypto";
import { Addresses } from "./enum/Addresses";

// A space is the only separator ContactNamePattern accepts between name segments.
const CONTACT_NAME_FORMAT_SAMPLE = "O Neil Zoe";

/**
 * Valid contact name, unique per call — duplicates are rejected on save.
 *
 * @see [ContactNamePattern](../../../domain/entity/contact/src/schema.ts) for the accepted format.
 */
export function generateContactName(): string {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 6);

  return `${CONTACT_NAME_FORMAT_SAMPLE} ${suffix}`.normalize("NFC");
}

export type ContactAddressTestData = Readonly<{
  ticker: string;
  networkId: string;
  networkName: string;
  addressInput: string;
  savedValue: string;
  /** The label the name step prefills, which is the selected asset name. */
  defaultAddressLabel: string;
  /**
   * Labels are unique per contact, so a second address on the same network has to be renamed
   * before Continue enables.
   */
  addressLabel: string;
  isEns?: boolean;
}>;

export const CONTACT_ADDRESS_DATASET: readonly ContactAddressTestData[] = [
  {
    ticker: "ETH",
    networkId: "ethereum",
    networkName: "Ethereum",
    addressInput: Addresses.ETH_OTHER_SEED,
    savedValue: Addresses.ETH_OTHER_SEED,
    defaultAddressLabel: "Ethereum",
    addressLabel: "Ethereum",
  },
  {
    ticker: "ETH",
    networkId: "ethereum",
    networkName: "Ethereum",
    addressInput: "speculos-qaa.eth",
    savedValue: Addresses.ETH_2,
    defaultAddressLabel: "Ethereum",
    addressLabel: "ENS",
    isEns: true,
  },
  {
    ticker: "BNB",
    networkId: "bsc",
    networkName: "BNB Chain",
    addressInput: Addresses.SWAP_HISTORY_ETH_TO,
    savedValue: Addresses.SWAP_HISTORY_ETH_TO,
    defaultAddressLabel: "BNB Chain",
    addressLabel: "BNB Chain",
  },
  {
    ticker: "POL",
    networkId: "polygon",
    networkName: "Polygon",
    addressInput: Addresses.SWAP_HISTORY_ERC20_ETH_USDT_TO,
    savedValue: Addresses.SWAP_HISTORY_ERC20_ETH_USDT_TO,
    defaultAddressLabel: "Polygon",
    addressLabel: "Polygon",
  },
];
