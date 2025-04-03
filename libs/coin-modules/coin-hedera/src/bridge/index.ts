import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import resolver from "../signer/index";
import { serialization } from "../transaction";
import type { HederaAccountBridge, HederaBridge, HederaSigner } from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { receive } from "./receive";
import { buildSignOperation } from "./signOperation";
import { buildIterateResult, getAccountShape } from "./synchronisation";

function buildCurrencyBridge(signerContext: SignerContext<HederaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    buildIterateResult,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape });

function buildAccountBridge(signerContext: SignerContext<HederaSigner>): HederaAccountBridge {
  const getAddress = resolver(signerContext);

  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive: receive(getAddressWrapper(getAddress)),
    signOperation,
    broadcast,
    getSerializedAddressParameters,
  };
}

export function createBridges(signerContext: SignerContext<HederaSigner>): HederaBridge {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
    ...serialization,
  };
}
