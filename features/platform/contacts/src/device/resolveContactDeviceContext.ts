import type { ContactAddress } from "@domain/entity-contact";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactsDeviceInitializationInput } from "./types";

const SUPPORTED_MANAGER_APP_NAMES = new Set(["Ethereum", "Tron"]);

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

function findContactDeviceCurrency(
  currencyId: ContactAddress["currencyId"],
): CryptoCurrency | undefined {
  const currency =
    findCryptoCurrencyById(currencyId) ?? findCryptoCurrencyById(currencyId.split("/")[0]);

  return currency !== undefined && SUPPORTED_MANAGER_APP_NAMES.has(currency.managerAppName)
    ? currency
    : undefined;
}

/** The Contacts kit keys its family table by coin app, and several EVM networks ship their own. */
export function isContactDeviceCurrencySupported(
  currencyId: ContactAddress["currencyId"],
): boolean {
  return findContactDeviceCurrency(currencyId) !== undefined;
}

export function resolveContactDeviceContext(
  currencyId: ContactAddress["currencyId"],
): ContactDeviceContext {
  const currency = findContactDeviceCurrency(currencyId);

  if (currency === undefined) {
    throw new UnsupportedContactDeviceCurrencyError(currencyId);
  }

  return {
    blockchainFamily: currency.family,
    chainId: currency.ethereumLikeInfo?.chainId ?? currency.coinType,
    initializationInput: {
      appName: currency.managerAppName,
      dependencies: [],
      requireLatestFirmware: false,
    },
  };
}
