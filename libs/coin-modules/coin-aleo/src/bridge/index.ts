import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import type {
  AccountBridge,
  Bridge,
  CurrencyBridge,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { Observable } from "rxjs";
import aleoCoinConfig from "../config";
import { ALEO_DUMMY_ADDRESS } from "../constants";
import type { AleoAccount, AleoCoinConfig, Transaction as AleoTransaction } from "../types";
import type { AleoSigner } from "../types/signer";
import resolver from "../signer/getAddress";
import { validateAddress } from "../logic/validateAddress";
import { broadcast } from "./broadcast";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { makeGetAccountShape, sync } from "./sync";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  assignToTokenAccountRaw,
  assignFromTokenAccountRaw,
  toOperationExtraRaw,
  fromOperationExtraRaw,
} from "./serialization";
import { getTransactionStatus } from "./getTransactionStatus";
import { buildSignOperation } from "./signOperation";

export function buildCurrencyBridge(signerContext: SignerContext<AleoSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(),
    getAddressFn: getAddress,
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<AleoSigner>,
): AccountBridge<AleoTransaction, AleoAccount> {
  const getAddress = resolver(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    createTransaction,
    updateTransaction: updateTransaction<AleoTransaction>,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    signRawOperation: (): Observable<SignOperationEvent> => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    estimateMaxSpendable,
    getEstimationRecipient: () => ALEO_DUMMY_ADDRESS,
    assignFromAccountRaw,
    assignToAccountRaw,
    assignToTokenAccountRaw,
    assignFromTokenAccountRaw,
    toOperationExtraRaw,
    fromOperationExtraRaw,
    getSerializedAddressParameters,
    validateAddress,
  };
}

export function createBridges(
  signerContext: SignerContext<AleoSigner>,
  coinConfig: CoinConfig<AleoCoinConfig>,
): Bridge<AleoTransaction, AleoAccount> {
  aleoCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
