import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { CoinConfig } from "../config";
import { setCoinConfig } from "../config";
import type { SignerContext } from "../types/signer";
import type { Transaction, TransactionStatus, ZcashAccount } from "../types/bridge";
import { ZCASH_ESTIMATION_RECIPIENT } from "../constants";
import getAddress from "../signer/getAddress";
import getFullViewingKeyResolver, {
  type GetFullViewingKeyResult,
} from "../signer/getFullViewingKey";
import { getSerializedAddressParameters } from "./exchange";
import { validateAddress } from "../logic/validateAddress";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { makeGetAccountShape, postSync } from "./sync";
import { updateTransaction } from "./updateTransaction";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import formatters from "./transaction";

/**
 * `getFullViewingKey` is not part of `AccountBridge`: the UFVK export flow is
 * Zcash-only, so the host app reaches it through this widened type (LLD's
 * ZCashExportKeyFlowModal). Mirrors coin-bitcoin's `BitcoinAccountBridge`.
 */
export type ZcashAccountBridge = AccountBridge<Transaction, ZcashAccount, TransactionStatus> & {
  getFullViewingKey: (
    account: ZcashAccount,
    options: { deviceId: string; path?: string },
  ) => Promise<GetFullViewingKeyResult>;
};

/**
 * Assembles the thin `AccountBridge`/`CurrencyBridge` (LL device path) -- every
 * method here delegates to a sibling module, or to `logic/` for what the
 * headless api shares (coin selection, address rules, PCZT craft/combine/
 * broadcast). The only bespoke residue is `signOperation` (PCZT device
 * orchestration).
 */
export function createBridges(signerContext: SignerContext, coinConfig: CoinConfig) {
  setCoinConfig(coinConfig);

  const getAddressFn = getAddress(signerContext);
  const getFullViewingKeyFn = getFullViewingKeyResolver(signerContext);
  const getAccountShape = makeGetAccountShape(signerContext);

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
    prepareTransaction,
    getTransactionStatus,
    estimateMaxSpendable,
    sync,
    receive,
    signOperation: buildSignOperation(signerContext),
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    assignFromAccountRaw,
    assignToAccountRaw,
    formatAccountSpecifics: () => "",
    getSerializedAddressParameters,
    validateAddress: (address: string) =>
      validateAddress(address, { currencyId: "zcash", networkId: 0 }),
    // Placeholder recipient for the flows that price a transaction before the
    // user has typed one (swap max estimation, quote fee context). Without it
    // live-common's default extension throws.
    getEstimationRecipient: () => ZCASH_ESTIMATION_RECIPIENT,
    getFullViewingKey: (account, { deviceId, path }) =>
      getFullViewingKeyFn(deviceId, {
        currency: account.currency,
        path: path ?? account.freshAddressPath,
      }),
  };

  return {
    currencyBridge,
    accountBridge,
    formatters,
  };
}
