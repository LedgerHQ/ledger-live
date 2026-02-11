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
import type { Transaction as AleoTransaction } from "../types/index";
import type { AleoSigner } from "../types/signer";
import resolver from "../signer/getAddress";
import { validateAddress } from "../logic/validateAddress";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getAccountShape, sync } from "./sync";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";
import { getTransactionStatus } from "./getTransactionStatus";

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

  return {
    createTransaction,
    updateTransaction: updateTransaction<AleoTransaction>,
    prepareTransaction,
    getTransactionStatus,
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
): Bridge<AleoTransaction> {
  aleoCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
