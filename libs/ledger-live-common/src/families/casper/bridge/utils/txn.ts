import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { InvalidAddress } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CLPublicKey, DeployUtil } from "casper-js-sdk";
import { encodeOperationId } from "../../../../operation";
import { CASPER_NETWORK } from "../../consts";
import { getEstimatedFees } from "../../utils";
import {
  getPubKeySignature,
  getPublicKeyFromCasperAddress,
  validateAddress,
} from "./addresses";
import { LTxnHistoryData } from "./types";

export const getUnit = (): Unit => getCryptoCurrencyById("filecoin").units[0];

export function mapTxToOps(
  accountId: string,
  addressHash: string,
  fees = getEstimatedFees()
) {
  return (tx: LTxnHistoryData): Operation[] => {
    const ops: Operation[] = [];
    const {
      timestamp,
      amount,
      toAccount,
      fromAccount,
      deployHash: hash,
      transferId,
    } = tx;

    const date = new Date(timestamp);
    const value = new BigNumber(amount);
    const feeToUse = fees;

    const isSending = addressHash === fromAccount;
    const isReceiving = addressHash === toAccount;

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash,
        type: "OUT",
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight: 1,
        blockHash: null,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          transferId,
        },
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value,
        fee: feeToUse,
        blockHeight: 1,
        blockHash: null,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          transferId,
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
  network = CASPER_NETWORK
): DeployUtil.Deploy => {
  log("debug", `Creating new Deploy: ${sender}, ${recipient}, ${network}`);

  if (recipient && !validateAddress(recipient).isValid) {
    throw InvalidAddress(`Invalid recipient Address ${recipient}`);
  }

  const deployParams = new DeployUtil.DeployParams(
    new CLPublicKey(
      Buffer.from(getPublicKeyFromCasperAddress(sender), "hex"),
      2
    ),
    network
  );
  const recipientBuff = Buffer.from(
    getPublicKeyFromCasperAddress(recipient),
    "hex"
  );

  const session =
    DeployUtil.ExecutableDeployItem.newTransferWithOptionalTransferId(
      amount?.toNumber() ?? 0,
      new CLPublicKey(recipientBuff, getPubKeySignature(recipient ?? sender)),
      undefined,
      transferId
    );

  const payment = DeployUtil.standardPayment(fees.toString());
  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);
  const txnRaw = DeployUtil.deployToJson(deploy);
  const txnFromRaw = DeployUtil.deployFromJson(txnRaw).unwrap();

  return txnFromRaw;
};
