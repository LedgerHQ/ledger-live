import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";

import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import resolver from "../hw-getAddress";
import { initAccount } from "../initAccount";
import { broadcast } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { prepareTransaction } from "../prepareTransaction";
import { buildSignOperation } from "../signOperation";
import { getAccountShape } from "../synchronization";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import type { Transaction } from "../types";
import { IconAddress, IconSignature, IconSigner } from "../signer";

export function buildCurrencyBridge(
  signerContext: SignerContext<IconSigner, IconAddress | IconSignature>,
): CurrencyBridge {
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

export function buildAccountBridge(
  signerContext: SignerContext<IconSigner, IconAddress | IconSignature>,
): AccountBridge<Transaction> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });

  return {
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
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
  };
}

export function createBridges(
  signerContext: SignerContext<IconSigner, IconAddress | IconSignature>,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
