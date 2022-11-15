import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { InvalidAddress } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CLPublicKey, DeployUtil } from "casper-js-sdk";
import { encodeOperationId } from "../../../../operation";
import { CASPER_FEES, CASPER_NETWORK } from "../../consts";
import { getPubKeySignature, validateAddress } from "./addresses";
import { LTxnHistoryData } from "./types";

export const getUnit = (): Unit => getCryptoCurrencyById("filecoin").units[0];

export function mapTxToOps(accountId: string, addressHash: string) {
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
    const feeToUse = new BigNumber(CASPER_FEES);

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
          "Transfer ID": transferId,
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
          "Transfer ID": transferId,
        },
      });
    }

    return ops;
  };
}

export const createNewDeploy = (
  sender: string,
  recipient?: string,
  amount?: BigNumber,
  transferId?: string,
  network = CASPER_NETWORK
): DeployUtil.Deploy => {
  log("debug", `Creating new Deploy: ${sender}, ${recipient}, ${network}`);

  if (recipient && !validateAddress(recipient).isValid) {
    throw InvalidAddress(`Invalid recipient Address ${recipient}`);
  }

  const deployParams = new DeployUtil.DeployParams(
    new CLPublicKey(Buffer.from(sender.substring(2), "hex"), 2),
    network
  );
  const recipientBuff = recipient
    ? Buffer.from(recipient.substring(2), "hex")
    : Buffer.from(sender.substring(2), "hex");

  const session =
    DeployUtil.ExecutableDeployItem.newTransferWithOptionalTransferId(
      amount?.toNumber() ?? 0,
      new CLPublicKey(recipientBuff, getPubKeySignature(recipient ?? sender)),
      undefined,
      transferId
    );

  const payment = DeployUtil.standardPayment(CASPER_FEES.toString());
  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);
  const txnRaw = DeployUtil.deployToJson(deploy);
  const txnFromRaw = DeployUtil.deployFromJson(txnRaw).unwrap();

  return txnFromRaw;
};
