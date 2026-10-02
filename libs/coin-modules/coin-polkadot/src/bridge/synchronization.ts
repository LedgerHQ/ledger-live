import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { makeSync, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { PolkadotContext } from "../config";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";
import polkadotAPI from "../network";
import { PolkadotAccount } from "../types";

export const makeGetAccountShape =
  (context: PolkadotContext): GetAccountShape<PolkadotAccount> =>
  async info => {
    await loadPolkadotCrypto();

    const { address, initialAccount, currency, derivationMode } = info;

    const assethubCurrency = getCryptoCurrencyById("assethub_polkadot");
    const assethubConfig = await context.config(assethubCurrency?.id);

    const shouldMigrate = currency.id === "polkadot" && assethubConfig.hasBeenMigrated;
    const currencyToUse = shouldMigrate ? assethubCurrency : currency;
    const config = await context.config(currencyToUse.id);

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
    } = await polkadotAPI.getAccount(context.logger, config, address, currencyToUse);

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
      context.logger,
      config,
      accountId,
      address,
      currencyToUse,
      startAt,
    );
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

export const makeSyncBridge = (context: PolkadotContext) =>
  makeSync({ getAccountShape: makeGetAccountShape(context) });
