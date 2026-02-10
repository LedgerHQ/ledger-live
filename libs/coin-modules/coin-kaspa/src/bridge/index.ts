import getAddressWrapper, { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Result, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountBridge, CurrencyBridge, DerivationMode } from "@ledgerhq/types-live";

import resolver from "../hw-getAddress";
import type { KaspaAccount, Transaction, TransactionStatus } from "../types";
import { KaspaSigner } from "../types";

import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import getTransactionStatus from "./getTransactionStatus";
import { initAccount } from "./initAccount";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { getAccountShape } from "./synchronization";
import { validateAddress } from "./validateAddress";

function buildCurrencyBridge(signerContext: SignerContext<KaspaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
    buildIterateResult: kaspaIterateResultBuilder(getAddress),
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

const kaspaIterateResultBuilder = (getAddressFn: GetAddressFn) => () =>
  Promise.resolve(
    async ({
      index,
      derivationsCache,
      derivationScheme,
      derivationMode,
      currency,
      deviceId,
    }: {
      index: number | string;
      derivationsCache: Record<string, Result>;
      derivationScheme: string;
      derivationMode: DerivationMode;
      currency: CryptoCurrency;
      deviceId: string;
    }): Promise<Result | null> => {
      const accountPath = derivationScheme.split("/").slice(0, 3).join("/");
      const freshAddressPath = runDerivationScheme(accountPath, currency, {
        account: index,
      });
      let res = derivationsCache[freshAddressPath];
      if (!res) {
        res = await getAddressWrapper(getAddressFn)(deviceId, {
          currency,
          path: freshAddressPath,
          derivationMode,
        });
        derivationsCache[freshAddressPath] = res;
      }
      return res as Result;
    },
  );

function buildAccountBridge(
  signerContext: SignerContext<KaspaSigner>,
): AccountBridge<Transaction, KaspaAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const sync = makeSync({ getAccountShape });
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    getSerializedAddressParameters,
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    initAccount,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    estimateMaxSpendable,
    validateAddress,
  };
}

export function createBridges(signerContext: SignerContext<KaspaSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
