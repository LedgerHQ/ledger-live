import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CoinConfig } from "@ledgerhq/coin-framework/config";
import type {
  AccountBridge,
  Bridge,
  CurrencyBridge,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { Observable } from "rxjs";
import aleoCoinConfig, { type AleoCoinConfig } from "../config";
import type { AleoAccount, Transaction as AleoTransaction } from "../types/index";
import type { AleoSigner } from "../types/signer";
import { validateAddress } from "../logic/validateAddress";
import resolver from "../signer/getAddress";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { assignToAccountRaw, assignFromAccountRaw } from "./serialization";
import { getAccountShape, sync } from "./sync";

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
): AccountBridge<AleoTransaction, AleoAccount> {
  const getAddress = resolver(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  return {
    createTransaction,
    updateTransaction: updateTransaction<AleoTransaction>,
    prepareTransaction,
    getTransactionStatus,
    assignToAccountRaw,
    assignFromAccountRaw,
    sync,
    receive,
    signOperation: () => {
      throw new Error("signOperation is not supported");
    },
    signRawOperation: (): Observable<SignOperationEvent> => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast: () => {
      throw new Error("broadcast is not supported");
    },
    estimateMaxSpendable,
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
