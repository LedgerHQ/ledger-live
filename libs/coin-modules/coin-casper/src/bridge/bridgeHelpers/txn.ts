import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { InvalidAddress } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { CasperNetwork, PublicKey, Transaction } from "casper-js-sdk";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { CASPER_DEFAULT_TTL, CASPER_NETWORK } from "../../consts";
import { casperAccountHashFromPublicKey, isAddressValid } from "./addresses";
import { ITxnHistoryData } from "../../api/types";
import { getEstimatedFees } from "./fee";
import { CasperOperation } from "../../types";
import invariant from "invariant";
import { getCasperNodeRpcClient } from "../../api";

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

export const createNewTransaction = async (
  sender: string,
  recipient: string,
  amount: BigNumber,
  fees: BigNumber,
  transferId?: string,
  network = CASPER_NETWORK,
): Promise<Transaction> => {
  log("debug", `Creating new Transaction: ${sender}, ${recipient}, ${network}`);

  if (recipient && !isAddressValid(recipient)) {
    throw InvalidAddress(`Invalid recipient Address ${recipient}`);
  }

  const client = getCasperNodeRpcClient();
  const helper = await CasperNetwork.create(client);

  const tx = helper.createTransferTransaction(
    PublicKey.fromHex(sender),
    PublicKey.fromHex(recipient),
    network,
    amount.toString(),
    fees.toNumber(),
    CASPER_DEFAULT_TTL,
    parseInt(transferId ?? "0"),
  );

  return tx;
};
