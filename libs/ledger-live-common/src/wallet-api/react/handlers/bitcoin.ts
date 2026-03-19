import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import {
  bitcoinFamilyAccountGetAddressLogic,
  bitcoinFamilyAccountGetAddressesLogic,
  bitcoinFamilyAccountGetPublicKeyLogic,
  bitcoinFamilyAccountGetXPubLogic,
} from "../../logic/bitcoin";
import type { HandlerDeps } from "../types";

export function createBitcoinGetAddressHandler(getDeps: () => HandlerDeps): WalletHandlers["bitcoin.getAddress"] {
  return ({ accountId, derivationPath }) => {
    const { manifest, accounts, tracking } = getDeps();
    return bitcoinFamilyAccountGetAddressLogic(
      { manifest, accounts, tracking },
      accountId,
      derivationPath,
    );
  };
}

export function createBitcoinGetAddressesHandler(getDeps: () => HandlerDeps): WalletHandlers["bitcoin.getAddresses"] {
  return ({ accountId, intentions }) => {
    const { manifest, accounts, tracking } = getDeps();
    return bitcoinFamilyAccountGetAddressesLogic(
      { manifest, accounts, tracking },
      accountId,
      intentions,
    );
  };
}

export function createBitcoinGetPublicKeyHandler(getDeps: () => HandlerDeps): WalletHandlers["bitcoin.getPublicKey"] {
  return ({ accountId, derivationPath }) => {
    const { manifest, accounts, tracking } = getDeps();
    return bitcoinFamilyAccountGetPublicKeyLogic(
      { manifest, accounts, tracking },
      accountId,
      derivationPath,
    );
  };
}

export function createBitcoinGetXPubHandler(getDeps: () => HandlerDeps) {
  return ({ accountId }) => {
    const { manifest, accounts, tracking } = getDeps();
    return bitcoinFamilyAccountGetXPubLogic({ manifest, accounts, tracking }, accountId);
  };
}
