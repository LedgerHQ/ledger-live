// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import invariant from "invariant";
import { defer, from, map, of, switchMap, tap } from "rxjs";
import { createBridges } from "@ledgerhq/coin-hedera/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import Hedera from "@ledgerhq/hw-app-hedera";
import hederaResolver from "@ledgerhq/coin-hedera/signer/index";
import type {
  HederaCoinConfig,
  TransactionStatus,
  Transaction,
  HederaAccount,
} from "@ledgerhq/coin-hedera/types/index";
import type { Bridge } from "@ledgerhq/types-live";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";
import type { DeriveAccountDescriptor, RunOnTransport } from "../../coin-modules/types";
import { toLegacyPath } from "../../account-data/full-sync/placeholderAccount";
import { withGenericTransactionSupport } from "./legacyBridgeAdapter";
import { getAddressesForPublicKey } from "./bridge/api";
import { createSigner as createFrameworkSigner } from "./signer";

const createSigner: CreateSigner<Hedera> = (transport: Transport) => {
  return new Hedera(transport);
};

const getCurrencyConfig = (currencyId?: string) => {
  invariant(currencyId, "hedera: currencyId is required in getCurrencyConfig");
  return getCurrencyConfiguration<HederaCoinConfig>(currencyId);
};

const legacyBridge: Bridge<Transaction, HederaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const bridge: Bridge<Transaction, HederaAccount, TransactionStatus> = {
  ...legacyBridge,
  accountBridge: withGenericTransactionSupport(legacyBridge.accountBridge),
};

const resolver: Resolver = createResolver(createSigner, hederaResolver);

/** The account ids the mirror node lists per derived key path, for one scan (its `runOnTransport`): one device read and one lookup per mode. */
const accountIdsByScan = new WeakMap<RunOnTransport, Map<string, string[]>>();

/** The index-th account the mirror node lists for the key at the candidate path, as the address lookup of the generic bridge's scan; `null` past them ends the mode. */
const deriveAccountDescriptor: DeriveAccountDescriptor = (runOnTransport, currency, candidate) => {
  const path = toLegacyPath(candidate.addressPath);
  const scanCache = accountIdsByScan.get(runOnTransport) ?? new Map<string, string[]>();
  accountIdsByScan.set(runOnTransport, scanCache);
  const accountIds$ = defer(() => {
    const cached = scanCache.get(path);
    if (cached) return of(cached);
    return runOnTransport(transport =>
      from(createFrameworkSigner(transport).getAddress(path)),
    ).pipe(
      switchMap(({ publicKey }) => getAddressesForPublicKey(currency, publicKey)),
      tap(accountIds => scanCache.set(path, accountIds)),
    );
  });
  return accountIds$.pipe(
    map(accountIds => {
      const accountId = accountIds[candidate.index];
      if (!accountId) return null;
      const descriptor = AccountDescriptorSchema.parse({
        purpose: "account",
        version: "2",
        type: "address",
        network: candidate.network,
        key: accountId,
        path: candidate.addressPath,
      });
      return { descriptor, keyHasMoreAccounts: candidate.index < accountIds.length - 1 };
    }),
  );
};

export { bridge, resolver, deriveAccountDescriptor };
