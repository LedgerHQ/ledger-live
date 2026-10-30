import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { DeviceModelId } from "@ledgerhq/devices";
import { throwError } from "rxjs";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { ZcashContext } from "../config";
import type { SignerContext } from "../types/signer";
import type { Transaction, TransactionStatus, ZcashAccount } from "../types/bridge";
import { zainoEndpoint, ZCASH_ESTIMATION_RECIPIENT } from "../constants";
import getAddress from "../signer/getAddress";
import getFullViewingKeyResolver, {
  type GetFullViewingKeyResult,
} from "../signer/getFullViewingKey";
import getShieldedAddressResolver from "../signer/getShieldedAddress";
import { getSerializedAddressParameters } from "./exchange";
import { validateAddress } from "../logic/validateAddress";
import { buildBroadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { buildEstimateMaxSpendable } from "./estimateMaxSpendable";
import { buildGetTransactionStatus } from "./getTransactionStatus";
import { buildPrepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { makeGetAccountShape, postSync } from "./sync";
import { updateTransaction } from "./updateTransaction";
import { assignToAccountRaw, makeAssignFromAccountRaw } from "./serialization";
import formatters from "./transaction";
import { ZcashShieldedNotSupportedOnDevice } from "../types/errors";
import { getZCashClient } from "../logic/engineClient";
import { birthdayTimestamp } from "../logic/birthday";
import {
  buildLegacyBroadcast,
  buildLegacyEstimateMaxSpendable,
  buildLegacyGetTransactionStatus,
  buildLegacyPrepareTransaction,
  buildLegacySignOperation,
  buildPreparedLegacySignOperation,
} from "../legacy";

/**
 * `getFullViewingKey` is not part of `AccountBridge`: the UFVK export flow is
 * Zcash-only, so the host app reaches it through this widened type (LLD's
 * ZCashExportKeyFlowModal).
 */
export type ZcashAccountBridge = AccountBridge<Transaction, ZcashAccount, TransactionStatus> & {
  getFullViewingKey: (
    account: ZcashAccount,
    options: { deviceId: string; path?: string },
  ) => Promise<GetFullViewingKeyResult>;
  deriveShieldedAddress: (ufvk: string) => Promise<string>;
  findBlockHeightAtDate: (account: ZcashAccount, birthday: string) => Promise<number>;
  getShieldedAddress: (
    account: ZcashAccount,
    options: { deviceId: string; path?: string; display?: boolean },
  ) => Promise<{ address: string }>;
};

export type ZcashBridgeOptions = {
  /**
   * Whether the host runs the shielded engine, read each time a bridge method is
   * called (the host's feature flag can change at runtime). When it answers false
   * the bridge is transparent-only: sync skips the shielded leg and every send
   * goes through `src/legacy`, so nothing reaches the native engine.
   * @default () => false
   */
  isShieldedEnabled?: () => boolean;
};

/**
 * Assembles the thin `AccountBridge`/`CurrencyBridge` (LL device path) -- every
 * method here delegates to a sibling module, or to `logic/` for what the
 * headless api shares (coin selection, address rules, PCZT craft/combine/
 * broadcast). The only bespoke residue is `signOperation` (PCZT device
 * orchestration).
 */
export function createBridges(
  signerContext: SignerContext,
  context: ZcashContext,
  options: ZcashBridgeOptions = {},
) {
  const isShieldedEnabled = options.isShieldedEnabled ?? (() => false);
  // Picks the implementation at call time, so a flag flip applies to the next call.
  const byMode =
    <A extends unknown[], R>(
      shielded: (...args: A) => R,
      transparentOnly: (...args: A) => R,
    ): ((...args: A) => R) =>
    (...args) =>
      (isShieldedEnabled() ? shielded : transparentOnly)(...args);
  const shieldedSign = buildSignOperation(signerContext, context);
  const legacySign = buildLegacySignOperation(signerContext, context);
  const nanoSLegacySign = buildPreparedLegacySignOperation(signerContext, context);
  const getAddressFn = getAddress(signerContext);
  const getFullViewingKeyFn = getFullViewingKeyResolver(signerContext);
  const getShieldedAddressFn = getShieldedAddressResolver(signerContext);
  const getAccountShape = makeGetAccountShape(signerContext, context, isShieldedEnabled);

  const scanAccounts = makeScanAccounts<ZcashAccount>({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddressFn),
    postSync,
  });

  const currencyBridge: CurrencyBridge = {
    scanAccounts,
  };

  const sync = makeSync<Transaction, ZcashAccount, TransactionStatus>({
    getAccountShape,
    postSync,
    shouldMergeOps: false,
  });

  const receive = makeAccountBridgeReceive<ZcashAccount>(getAddressWrapper(getAddressFn));

  const accountBridge: ZcashAccountBridge = {
    createTransaction,
    updateTransaction,
    prepareTransaction: byMode(
      buildPrepareTransaction(context),
      buildLegacyPrepareTransaction(context),
    ),
    getTransactionStatus: byMode(
      buildGetTransactionStatus(context),
      buildLegacyGetTransactionStatus(context),
    ),
    estimateMaxSpendable: byMode(
      buildEstimateMaxSpendable(context),
      buildLegacyEstimateMaxSpendable(context),
    ),
    sync,
    receive,
    signOperation: args => {
      if (!isShieldedEnabled()) return legacySign(args);
      // The Nano S Zcash app predates PCZT signing: it only speaks the legacy transparent protocol.
      if (args.deviceModelId !== DeviceModelId.nanoS) return shieldedSign(args);
      return args.transaction.transferType === "transparent"
        ? nanoSLegacySign(args)
        : throwError(() => new ZcashShieldedNotSupportedOnDevice());
    },
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast: byMode(buildBroadcast(context), buildLegacyBroadcast(context)),
    assignFromAccountRaw: makeAssignFromAccountRaw(context.logger),
    assignToAccountRaw,
    formatAccountSpecifics: () => "",
    getSerializedAddressParameters,
    validateAddress,
    // Placeholder recipient for the flows that price a transaction before the
    // user has typed one (swap max estimation, quote fee context). Without it
    // live-common's default extension throws.
    getEstimationRecipient: () => ZCASH_ESTIMATION_RECIPIENT,
    getFullViewingKey: (account, { deviceId, path }) =>
      getFullViewingKeyFn(deviceId, {
        currency: account.currency,
        path: path ?? account.freshAddressPath,
      }),
    // The address is derived from the UFVK alone, which encodes its own network;
    // the endpoint is never contacted.
    deriveShieldedAddress: async (ufvk: string) => {
      const client = await getZCashClient(
        zainoEndpoint((await context.config("zcash")).zaino.url, "zcash"),
      );
      return client.deriveShieldedAddress(ufvk);
    },
    // Resolves a birthday to the block height a scan from that date starts at.
    findBlockHeightAtDate: async (account, birthday) => {
      const currencyId = account.currency.id;
      const client = await getZCashClient(
        zainoEndpoint((await context.config(currencyId)).zaino.url, currencyId),
      );
      return client.findBlockHeight(birthdayTimestamp(birthday));
    },
    getShieldedAddress: (account, { deviceId, path, display }) =>
      getShieldedAddressFn(deviceId, {
        path: path ?? account.freshAddressPath,
        ...(display !== undefined && { display }),
      }),
  };

  return {
    currencyBridge,
    accountBridge,
    formatters,
  };
}
