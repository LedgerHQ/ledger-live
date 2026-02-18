import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../config";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";
import polkadotAPI from "../network";
import { PolkadotAccount } from "../types";

export const getAccountShape: GetAccountShape<PolkadotAccount> = async info => {
  await loadPolkadotCrypto();

  const { address, initialAccount, currency, derivationMode } = info;

  const assethubCurrency = getCryptoCurrencyById("assethub_polkadot");
  const assethubConfig = coinConfig.getCoinConfig(assethubCurrency);

  const shouldMigrate = currency.id === "polkadot" && assethubConfig.hasBeenMigrated;
  const currencyToUse = shouldMigrate ? assethubCurrency : currency;

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

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currencyToUse.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
  const newOperations = await polkadotAPI.getOperations(accountId, address, currencyToUse, startAt);
  const operations = mergeOps(oldOperations, newOperations);

  return {
    id: accountId,
    balance,
    currency: currencyToUse,
    spendableBalance,
    operations: shouldMigrate ? [] : operations,
    operationsCount: shouldMigrate ? 0 : operations.length,
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
};

export const sync = makeSync({ getAccountShape });

export default getAccountShape;
