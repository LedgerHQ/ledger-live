import type { ContactAddress } from "@domain/entity-contact";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
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

/**
 * Device initialization input for the Contacts operations the device OS serves
 * from the dashboard (contact rename), rather than an embedded coin app.
 *
 * `BOLOS` is the dashboard's own app name, which makes DIE Phase 2 skip its
 * open-app step: with no dependencies and no firmware floor, initialization
 * narrows to connecting, unlocking and onboarding checks. The kit's device
 * action then walks to the dashboard itself and enforces the minimum OS
 * version, so there is nothing left for the host to gate on here.
 */
export const CONTACTS_DASHBOARD_INITIALIZATION_INPUT: ContactsDeviceInitializationInput = {
  appName: "BOLOS",
  dependencies: [],
  requireLatestFirmware: false,
};

export function resolveContactDeviceContext(
  currencyId: ContactAddress["currencyId"],
): ContactDeviceContext {
  const currency =
    findCryptoCurrencyById(currencyId) ?? findCryptoCurrencyById(currencyId.split("/")[0]);

  if (currency === undefined || !SUPPORTED_MANAGER_APP_NAMES.has(currency.managerAppName)) {
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
