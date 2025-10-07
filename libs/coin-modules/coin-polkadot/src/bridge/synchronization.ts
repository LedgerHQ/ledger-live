import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";
import { PolkadotAccount } from "../types";
import polkadotAPI from "../network";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

export const getAccountShape: GetAccountShape<PolkadotAccount> = async info => {
  await loadPolkadotCrypto();

  try {
    const { address, initialAccount, currency, derivationMode } = info;

    // Check if migration is needed and handle it automatically
    const shouldMigrate = currency.id === "polkadot";
    const currencyToUse = shouldMigrate ? getCryptoCurrencyById("assethub_polkadot") : currency;

    // Retrieve account info
    const {
      blockHeight,
      balance,
      spendableBalance,
      nonce,
      lockedBalance,
      controller,
      stash,
      unlockedBalance,
      unlockingBalance,
      unlockings,
      nominations,
      numSlashingSpans,
    } = await polkadotAPI.getAccount(address, currencyToUse);

    // Retrieve operations associated

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currencyToUse.id,
      xpubOrAddress: address,
      derivationMode,
    });
    const oldOperations = initialAccount?.operations || [];
    const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
    const newOperations = await polkadotAPI.getOperations(
      accountId,
      address,
      currencyToUse,
      startAt,
    );
    const operations = mergeOps(oldOperations, newOperations);

    return {
      id: accountId,
      balance,
      spendableBalance,
      operations,
      operationsCount: operations.length,
      blockHeight,
      polkadotResources: {
        nonce,
        controller,
        stash,
        lockedBalance,
        unlockedBalance,
        unlockingBalance,
        unlockings,
        nominations,
        numSlashingSpans,
      },
    };
  } catch (error) {
    console.error("Error getting account shape", error);
    throw error;
  }
};

export const sync = makeSync({ getAccountShape });

export default getAccountShape;
