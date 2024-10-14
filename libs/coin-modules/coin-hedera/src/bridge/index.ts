import { makeScanAccounts, makeSync } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import resolver from "../hw-getAddress";
import getAddressWrapper from "@ledgerhq/coin-framework/lib/bridge/getAddressWrapper";
import { HederaSigner } from "../signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { getAccountShape, sync } from "../synchronisation";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction, TransactionStatus } from "../types";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { scanAccounts, sync } from "../synchronisation";
import { signOperation } from "../signOperation";
import { broadcast } from "../broadcast";
import { receive } from "../receive";

  
  const sync = makeSync({ getAccountShape });
  
  function buildCurrencyBridge(signerContext: SignerContext<HederaSigner>): CurrencyBridge {
    const getAddress = resolver(signerContext);
  
    const scanAccounts = makeScanAccounts({
      getAccountShape,
      getAddressFn: getAddressWrapper(getAddress),
    });
  
    return {
      getPreloadStrategy,
      preload,
      hydrate,
      scanAccounts,
    };
  }
  
  function buildAccountBridge(
    signerContext: SignerContext<PolkadotSigner>,
  ): AccountBridge<Transaction, Account, TransactionStatus> {
    const getAddress = signerGetAddress(signerContext);
  
    const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
    const signOperation = buildSignOperation(signerContext);
  
    return {
      estimateMaxSpendable,
      createTransaction,
      updateTransaction: defaultUpdateTransaction,
      getTransactionStatus,
      prepareTransaction,
      sync,
      receive,
      signOperation,
      broadcast,
      assignFromAccountRaw,
      assignToAccountRaw,
      fromOperationExtraRaw,
      toOperationExtraRaw,
    };
  }
  
  export function createBridges(
    signerContext: SignerContext<PolkadotSigner>,
    coinConfig: CoinConfig<PolkadotCoinConfig>,
  ) {
    polkadotCoinConfig.setCoinConfig(coinConfig);
  
    return {
      currencyBridge: buildCurrencyBridge(signerContext),
      accountBridge: buildAccountBridge(signerContext),
    };
  }

  const currencyBridge: CurrencyBridge = {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
  
  const accountBridge: AccountBridge<Transaction, Account, TransactionStatus> = {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
  };
  
  export default {
    currencyBridge,
    accountBridge,
  };
  
  