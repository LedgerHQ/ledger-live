/* istanbul ignore file: pure exports, bridge tested by live-common with bridge.integration.test.ts */
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { EvmAddress, EvmSignature, EvmSigner } from "../types/signer";
import type { Transaction as EvmTransaction } from "../types/index";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { getAccountShape, sync } from "../synchronization";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import { hydrate, preload } from "../preload";
import nftResolvers from "../nftResolvers";
import { broadcast } from "../broadcast";
import resolver from "../hw-getAddress";

export function buildCurrencyBridge(
  signerContext: SignerContext<EvmSigner, EvmAddress | EvmSignature>,
): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload,
    hydrate,
    scanAccounts,
    nftResolvers,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<EvmSigner, EvmAddress | EvmSignature>,
): AccountBridge<EvmTransaction> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    createTransaction,
    updateTransaction: defaultUpdateTransaction<EvmTransaction>,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    broadcast,
    estimateMaxSpendable,
  };
}

export function createBridges(
  signerContext: SignerContext<EvmSigner, EvmAddress | EvmSignature>,
): Bridge<EvmTransaction> {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
