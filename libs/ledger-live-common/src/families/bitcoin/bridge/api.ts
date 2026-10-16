import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { BitcoinTxData } from "@ledgerhq/coin-bitcoin/api";
import { bitcoinAccountModuleBinding, computeIntentType } from "../accountModule";
import { getFamilySpecificData, type Transaction } from "../types";
import { buildSignRawOperation } from "../signRawOperation";
import signer from "../signer";

/**
 * Maps the user's choices (`familySpecificData`, ADR-047) onto the coin module's `BitcoinTxData`.
 * The account context — inputs, change, paths — is added by the account module.
 */
export function buildIntentData(transaction: Record<string, unknown>): BitcoinTxData {
  const tx = transaction as Partial<Transaction>;
  const { feePerByte, opReturnData } = getFamilySpecificData(tx);
  return {
    type: "bitcoin",
    // a set rate counts without a preset strategy — custom, or provided by a live app (no strategy)
    ...((!tx.feesStrategy || tx.feesStrategy === "custom") && feePerByte ? { feePerByte } : {}),
    ...(opReturnData ? { opReturnData } : {}),
  };
}

const bitcoinBridgeApi: BridgeApi = {
  computeIntentType,
  buildIntentData,
  // the fee rate the estimation settled on is the one the transaction is crafted with
  forwardsFeeParametersToCraft: true,
  // the device app depends on the currency
  getDeviceSignOptions: (_transaction, account) => ({ currencyId: account.currency.id }),
  signRawOperation: buildSignRawOperation(signer.context),
  // the account module returns the whole operation list, RBF-replaced ones removed
  shouldMergeOps: false,
  accountModule: bitcoinAccountModuleBinding,
};

export default bitcoinBridgeApi;
