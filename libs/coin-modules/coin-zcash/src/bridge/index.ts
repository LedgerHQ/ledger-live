import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { CoinConfig } from "../config";
import { setCoinConfig } from "../config";
import type { SignerContext } from "../types/signer";
import type { Transaction, TransactionStatus, ZcashAccount } from "../types/bridge";
import getAddress from "../signer/getAddress";
import { getSerializedAddressParameters } from "./exchange";
import { validateAddress } from "../logic/validateAddress";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { makeGetAccountShape, postSync } from "./sync";
import { updateTransaction } from "./updateTransaction";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import formatters from "./transaction";

/**
 * Assembles the thin `AccountBridge`/`CurrencyBridge` (LL device path) --
 * every method here delegates to `logic/` (see logic/index.ts). The only
 * bespoke residue is `signOperation` (PCZT device orchestration).
 */
export function createBridges(signerContext: SignerContext, coinConfig: CoinConfig) {
  setCoinConfig(coinConfig);

  const getAddressFn = getAddress(signerContext);
  const getAccountShape = makeGetAccountShape(signerContext);

  const scanAccounts = makeScanAccounts<ZcashAccount>({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddressFn),
    postSync,
  });

  const currencyBridge: CurrencyBridge = {
    scanAccounts,
  };

  const sync = makeSync<Transaction, ZcashAccount, TransactionStatus>({
    getAccountShape,
    postSync,
    shouldMergeOps: false,
  });

  const receive = makeAccountBridgeReceive<ZcashAccount>(getAddressWrapper(getAddressFn));

  const accountBridge: AccountBridge<Transaction, ZcashAccount, TransactionStatus> = {
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    estimateMaxSpendable,
    sync,
    receive,
    signOperation: buildSignOperation(signerContext),
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    assignFromAccountRaw,
    assignToAccountRaw,
    formatAccountSpecifics: () => "",
    getSerializedAddressParameters,
    validateAddress: (address: string) =>
      validateAddress(address, { currencyId: "zcash", networkId: 0 }),
  };

  return {
    currencyBridge,
    accountBridge,
    formatters,
  };
}
