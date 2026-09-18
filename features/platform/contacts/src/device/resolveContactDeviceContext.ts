import type { ContactAddress } from "@domain/entity-contact";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactsDeviceInitializationInput } from "./types";

/**
 * The Contacts kit keys its family table by coin app, so the app to open is a
 * property of the family rather than of the network: EVM networks with an explicit
 * EIP-155 chain ID register through Ethereum, told apart by that chain ID.
 */
const CONTACT_DEVICE_APP_BY_FAMILY: Readonly<Record<string, string>> = {
  evm: "Ethereum",
  tron: "Tron",
};

export class UnsupportedContactDeviceCurrencyError extends Error {
  override name = "UnsupportedContactDeviceCurrencyError" as const;

  constructor(currencyId: ContactAddress["currencyId"]) {
    super(`Currency "${currencyId}" is not supported by Contacts device intents`);
  }
}

export type ContactDeviceContext = Readonly<{
  blockchainFamily: string;
  chainId: string | number;
  initializationInput: ContactsDeviceInitializationInput;
}>;

export const CONTACTS_DASHBOARD_INITIALIZATION_INPUT: ContactsDeviceInitializationInput = {
  appName: "BOLOS",
  dependencies: [],
  requireLatestFirmware: false,
};

type ContactDeviceCurrency = Readonly<{
  currency: CryptoCurrency;
  appName: string;
  chainId: string | number;
}>;

function findContactDeviceCurrency(
  currencyId: ContactAddress["currencyId"],
): ContactDeviceCurrency | undefined {
  const currency =
    findCryptoCurrencyById(currencyId) ?? findCryptoCurrencyById(currencyId.split("/")[0]);
  if (currency === undefined) {
    return undefined;
  }

  const appName = CONTACT_DEVICE_APP_BY_FAMILY[currency.family];
  const chainId =
    currency.family === "evm" ? currency.ethereumLikeInfo?.chainId : currency.coinType;

  return appName === undefined || chainId === undefined
    ? undefined
    : { currency, appName, chainId };
}

export function isContactDeviceCurrencySupported(
  currencyId: ContactAddress["currencyId"],
): boolean {
  return findContactDeviceCurrency(currencyId) !== undefined;
}

export function resolveContactDeviceContext(
  currencyId: ContactAddress["currencyId"],
): ContactDeviceContext {
  const resolved = findContactDeviceCurrency(currencyId);

  if (resolved === undefined) {
    throw new UnsupportedContactDeviceCurrencyError(currencyId);
  }

  return {
    blockchainFamily: resolved.currency.family,
    chainId: resolved.chainId,
    initializationInput: {
      appName: resolved.appName,
      dependencies: [],
      requireLatestFirmware: false,
    },
  };
}
