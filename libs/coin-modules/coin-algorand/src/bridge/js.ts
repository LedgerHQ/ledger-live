import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import formatters from "../formatters";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { initAccount } from "../initAccount";
import { prepareTransaction } from "../prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";
import { AlgorandSigner } from "../signer";
import { buildSignOperation } from "../signOperation";
import { getAccountShape, sync } from "../synchronization";
import { serialization } from "../transaction";
import type { AlgorandAccountBridge, AlgorandBridge } from "../types";

function buildCurrencyBridge(signerContext: SignerContext<AlgorandSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

function buildAccountBridge(signerContext: SignerContext<AlgorandSigner>): AlgorandAccountBridge {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    assignToAccountRaw,
    assignFromAccountRaw,
    initAccount,
    signOperation,
    broadcast,
    estimateMaxSpendable,
    fromOperationExtraRaw,
    toOperationExtraRaw,
    getSerializedAddressParameters,
    ...formatters,
  };
}

export function createBridges(signerContext: SignerContext<AlgorandSigner>): AlgorandBridge {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
    ...serialization,
  };
}
