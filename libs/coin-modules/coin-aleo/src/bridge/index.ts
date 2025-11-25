import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  AccountBridge,
  Bridge,
  CurrencyBridge,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { Observable } from "rxjs";
import type { Transaction as AleoTransaction } from "../types/index";
import type { AleoSigner } from "../types/signer";
import resolver from "../signer/getAddress";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getAccountShape, sync } from "./sync";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";
import { getTransactionStatus } from "../bridge/getTransactionStatus";

export function buildCurrencyBridge(signerContext: SignerContext<AleoSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
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
): AccountBridge<AleoTransaction> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  const signOperation = () => {
    throw new Error("signOperation is not supported");
  };

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
    getSerializedAddressParameters,
  };
}

export function createBridges(signerContext: SignerContext<AleoSigner>): Bridge<AleoTransaction> {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
