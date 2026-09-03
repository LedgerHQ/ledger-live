import {
  getSerializedAddressParameters,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import concordiumCoinConfig from "../config";
import { CONCORDIUM_DUMMY_ADDRESS } from "../constants";
import resolver from "../signer";
import {
  type ConcordiumAccount,
  type ConcordiumCurrencyBridge,
  type ConcordiumSigner,
  type Transaction,
  type ConcordiumCoinConfig,
} from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { buildOnboardAccount, buildPairWalletConnect } from "./onboard";
import { prepareTransaction } from "./prepareTransaction";
import { buildReceive } from "./receive";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import { buildSignOperation } from "./signOperation";
import { getAccountShape } from "./sync";
import { stripSubAccounts } from "./tokens";
import { updateTransaction } from "./updateTransaction";
import { validateAddress } from "./validateAddress";

/**
 * See `stripSubAccounts` for why the shape cannot clear tokens itself. Wired
 * into scanning as well as syncing: a freshly discovered account never reaches
 * `makeSync`, and would keep an empty array until its first sync.
 */
const postSync = (_initial: ConcordiumAccount, synced: ConcordiumAccount): ConcordiumAccount =>
  concordiumCoinConfig.getCoinConfig(synced.currency.id).enableTokens
    ? synced
    : stripSubAccounts(synced);

export function createBridges(
  signerContext: SignerContext<ConcordiumSigner>,
  coinConfig: CoinConfig<ConcordiumCoinConfig>,
) {
  concordiumCoinConfig.setCoinConfig(coinConfig);

  const getAddress = resolver(signerContext);
  const receive = buildReceive(signerContext);
  const scanAccounts = makeScanAccounts({ getAccountShape, getAddressFn: getAddress, postSync });
  const onboardAccount = buildOnboardAccount(signerContext);
  const pairWalletConnect = buildPairWalletConnect();

  const currencyBridge: ConcordiumCurrencyBridge = {
    scanAccounts,
    pairWalletConnect,
    onboardAccount,
  };

  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape, postSync });

  const accountBridge: AccountBridge<Transaction, ConcordiumAccount> = {
    broadcast,
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    estimateMaxSpendable,
    getEstimationRecipient: () => CONCORDIUM_DUMMY_ADDRESS,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
    validateAddress,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
