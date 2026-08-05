import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { Unit } from "@ledgerhq/ledger-wallet-framework/types";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { ITxnHistoryData } from "../types/network";
import { CasperOperation } from "../types";
import { getEstimatedFees } from "./estimateFees";
import { casperAccountHashFromPublicKey } from "./validateAddress";

export const getUnit = (): Unit => getCryptoCurrencyById("casper").units[0];

export function mapTxToOps(
  accountId: string,
  addressHash: string,
  fees = getEstimatedFees(),
): (tx: ITxnHistoryData) => CasperOperation[] {
  return (tx: ITxnHistoryData): CasperOperation[] => {
    try {
      const ops: CasperOperation[] = [];
      const { timestamp, caller_public_key, args: txArgs, deploy_hash, error_message } = tx;
      const fromAccount = casperAccountHashFromPublicKey(caller_public_key);
      let toAccount;

      if (txArgs.target.cl_type === "PublicKey") {
        toAccount = casperAccountHashFromPublicKey(txArgs.target.parsed);
      } else {
        toAccount = txArgs.target.parsed;
      }
      invariant(toAccount, "toAccount is required");
      invariant(fromAccount, "fromAccount is required");

      const date = new Date(timestamp);
      const value = new BigNumber(txArgs.amount.parsed);
      const feeToUse = fees;

      const isSending = addressHash.toLowerCase() === fromAccount.toLowerCase();
      const isReceiving = addressHash.toLowerCase() === toAccount.toLowerCase();

      if (isSending) {
        ops.push({
          id: encodeOperationId(accountId, deploy_hash, "OUT"),
          hash: deploy_hash,
          type: "OUT",
          value: value.plus(feeToUse),
          fee: feeToUse,
          blockHeight: 1,
          hasFailed: error_message ? true : false,
          blockHash: null,
          accountId,
          senders: [fromAccount],
          recipients: [toAccount],
          date,
          extra: {
            transferId: txArgs.id.parsed?.toString(),
          },
        });
      }

      if (isReceiving) {
        ops.push({
          id: encodeOperationId(accountId, deploy_hash, "IN"),
          hash: deploy_hash,
          type: "IN",
          value,
          fee: feeToUse,
          blockHeight: 1,
          blockHash: null,
          hasFailed: error_message ? true : false,
          accountId,
          senders: [fromAccount],
          recipients: [toAccount],
          date,
          extra: {
            transferId: txArgs.id.parsed?.toString(),
          },
        });
      }

      return ops;
    } catch (err) {
      log("warn", `mapTxToOps failed for casper, skipping operation`, err);
      return [];
    }
  };
}
