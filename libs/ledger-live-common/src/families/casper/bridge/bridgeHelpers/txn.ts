import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { InvalidAddress } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { CLPublicKey, DeployUtil } from "casper-js-sdk";
import { encodeOperationId } from "../../../../operation";
import { CASPER_NETWORK } from "../../consts";
import {
  casperAddressEncode,
  casperPubKeyToAccountHash,
  getPubKeySignature,
  getPublicKeyFromCasperAddress,
  isAddressValid,
} from "./addresses";
import { ITxnHistoryData } from "../../api/types";
import { getEstimatedFees } from "./fee";
import { CasperOperation } from "../../types";

export const getUnit = (): Unit => getCryptoCurrencyById("casper").units[0];

export function mapTxToOps(
  accountId: string,
  addressHash: string,
  fees = getEstimatedFees(),
): (tx: ITxnHistoryData) => CasperOperation[] {
  return (tx: ITxnHistoryData): CasperOperation[] => {
    const ops: CasperOperation[] = [];
    const { timestamp, caller_public_key, args: txArgs, deploy_hash, error_message } = tx;
    const fromAccount = casperPubKeyToAccountHash(caller_public_key);
    const toAccount = txArgs.target.parsed;

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
  };
}

export const createNewDeploy = (
  sender: string,
  recipient: string,
  amount: BigNumber,
  fees: BigNumber,
  transferId?: string,
  network = CASPER_NETWORK,
): DeployUtil.Deploy => {
  log("debug", `Creating new Deploy: ${sender}, ${recipient}, ${network}`);

  if (recipient && !isAddressValid(recipient)) {
    throw InvalidAddress(`Invalid recipient Address ${recipient}`);
  }

  const deployParams = new DeployUtil.DeployParams(
    new CLPublicKey(Buffer.from(getPublicKeyFromCasperAddress(sender), "hex"), 2),
    network,
  );
  const recipientBuff = Buffer.from(getPublicKeyFromCasperAddress(recipient), "hex");

  const session = DeployUtil.ExecutableDeployItem.newTransferWithOptionalTransferId(
    amount?.toNumber() ?? 0,
    new CLPublicKey(recipientBuff, getPubKeySignature(recipient ?? sender)),
    undefined,
    transferId,
  );

  const payment = DeployUtil.standardPayment(fees.toString());
  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);
  const txnRaw = DeployUtil.deployToJson(deploy);
  const txnFromRaw = DeployUtil.deployFromJson(txnRaw).unwrap();

  return txnFromRaw;
};

export function deployHashToString(hash: Uint8Array, toLowerCase?: boolean): string {
  const str = casperAddressEncode(Buffer.from(hash));

  if (toLowerCase) return str.toLowerCase();
  return str;
}
