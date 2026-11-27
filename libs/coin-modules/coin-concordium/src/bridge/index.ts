import {
  getSerializedAddressParameters,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { defer, from, mergeMap } from "rxjs";
import { CONCORDIUM_DUMMY_ADDRESS, DEFAULT_ENABLE_TOKENS } from "../constants";
import resolver from "../signer";
import type {
  ConcordiumAccount,
  ConcordiumBridgeContext,
  ConcordiumCoinConfig,
  ConcordiumCurrencyBridge,
  ConcordiumSigner,
  Transaction,
} from "../types";
import { buildBroadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { buildEstimateMaxSpendable } from "./estimateMaxSpendable";
import { buildGetTransactionStatus } from "./getTransactionStatus";
import { buildOnboardAccount, buildPairWalletConnect } from "./onboard";
import { buildPrepareTransaction } from "./prepareTransaction";
import { buildReceive } from "./receive";
import { assignToAccountRaw, makeAssignFromAccountRaw } from "./serialization";
import { buildSignOperation } from "./signOperation";
import { makeGetAccountShape } from "./sync";
import { stripSubAccounts } from "./tokens";
import { updateTransaction } from "./updateTransaction";
import { validateAddress } from "./validateAddress";

/**
 * See `stripSubAccounts` for why the shape cannot clear tokens itself. Wired
 * into scanning as well as syncing: a freshly discovered account never reaches
 * `makeSync`, and would keep an empty array until its first sync.
 */
const makePostSync =
  (config: ConcordiumCoinConfig) =>
  (_initial: ConcordiumAccount, synced: ConcordiumAccount): ConcordiumAccount =>
    (config.enableTokens ?? DEFAULT_ENABLE_TOKENS) === true ? synced : stripSubAccounts(synced);

export function createBridges(
  signerContext: SignerContext<ConcordiumSigner>,
  context: ConcordiumBridgeContext,
) {
  const getAddress = resolver(signerContext);
  const receive = buildReceive(signerContext, context);

  // One config per subscription, so the shape and `postSync` agree on `enableTokens`.
  const scanAccounts: CurrencyBridge["scanAccounts"] = arg =>
    defer(() => from(context.config(arg.currency.id))).pipe(
      mergeMap(config =>
        makeScanAccounts({
          getAccountShape: makeGetAccountShape(config),
          getAddressFn: getAddress,
          postSync: makePostSync(config),
        })(arg),
      ),
    );
  const onboardAccount = buildOnboardAccount(signerContext, context);
  const pairWalletConnect = buildPairWalletConnect(context);

  const currencyBridge: ConcordiumCurrencyBridge = {
    scanAccounts,
    pairWalletConnect,
    onboardAccount,
  };

  const signOperation = buildSignOperation(signerContext, context);
  const prepareTransaction = buildPrepareTransaction(context);
  const getTransactionStatus = buildGetTransactionStatus(context);

  const sync: AccountBridge<Transaction, ConcordiumAccount>["sync"] = (account, syncConfig) =>
    defer(() => from(context.config(account.currency.id))).pipe(
      mergeMap(config =>
        // `getAccountShape` already merged. Merging again against the stored account
        // would undo the discard a re-read depends on and drop every refetched
        // operation older than the oldest stored one.
        makeSync({
          getAccountShape: makeGetAccountShape(config),
          postSync: makePostSync(config),
          shouldMergeOps: false,
        })(account, syncConfig),
      ),
    );

  const accountBridge: AccountBridge<Transaction, ConcordiumAccount> = {
    broadcast: buildBroadcast(context),
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    estimateMaxSpendable: buildEstimateMaxSpendable(prepareTransaction, getTransactionStatus),
    getEstimationRecipient: () => CONCORDIUM_DUMMY_ADDRESS,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    assignToAccountRaw,
    assignFromAccountRaw: makeAssignFromAccountRaw(context),
    getSerializedAddressParameters,
    validateAddress,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
