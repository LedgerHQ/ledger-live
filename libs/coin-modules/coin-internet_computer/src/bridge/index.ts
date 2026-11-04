import type { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { type IcpCurrencyConfig, nodeUrl } from "../config";
import { ICP_DUMMY_ADDRESS } from "../constants";
import resolver from "../signer";
import type {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
  ICPSigner,
} from "../types";
import { buildGetAccountShape, postSync } from "./bridgeHelpers/account";
import { buildBroadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import { buildSignOperation } from "./signOperation";
import { validateAddress } from "./validateAddress";

function buildCurrencyBridge(
  signerContext: SignerContext<ICPSigner>,
  resolveHost: () => string,
): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape: buildGetAccountShape(resolveHost),
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    scanAccounts,
  };
}

function buildAccountBridge(
  signerContext: SignerContext<ICPSigner>,
  resolveHost: () => string,
): AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape: buildGetAccountShape(resolveHost), postSync });

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    getEstimationRecipient: () => ICP_DUMMY_ADDRESS,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast: buildBroadcast(resolveHost),
    getSerializedAddressParameters,
    validateAddress,
    assignToAccountRaw,
    assignFromAccountRaw,
    toOperationExtraRaw,
    fromOperationExtraRaw,
  };
}

// The coin config is held per bridge pair, not in a module-level singleton, so two pairs built
// against different nodes do not leak into each other. Without one, the bridges reach mainnet.
export function createBridges(
  signerContext: SignerContext<ICPSigner>,
  coinConfig?: CoinConfig<IcpCurrencyConfig>,
) {
  const resolveHost = () => nodeUrl(coinConfig?.());
  return {
    currencyBridge: buildCurrencyBridge(signerContext, resolveHost),
    accountBridge: buildAccountBridge(signerContext, resolveHost),
  };
}
