import type {
  Account,
  DeviceId,
  Operation,
  OperationType,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { osmosisAPI } from "./api/sdk";
import { Observable } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import { LedgerSigner } from "@cosmjs/ledger-amino";
import { HdPath, stringToPath } from "@cosmjs/crypto";
import { buildTransaction, postBuildTransaction } from "./js-buildTransaction";
import BigNumber from "bignumber.js";
import { makeSignDoc } from "@cosmjs/launchpad";
import getEstimatedFees, {
  DEFAULT_FEES,
  getEstimatedGas,
} from "./js-getFeesForTransaction";

const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: DeviceId;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      let cancelled;

      async function main() {
        const { accountNumber, sequence } = await osmosisAPI.getAccount(
          account.freshAddress
        );
        const chainId = await osmosisAPI.getChainId();
        const hdPaths: HdPath = stringToPath("m/" + account.freshAddressPath);
        const ledgerSigner = new LedgerSigner(transport, {
          hdPaths: [hdPaths],
          prefix: account.currency.id,
        });
        o.next({ type: "device-signature-requested" });

        const { aminoMsgs, protoMsgs } = await buildTransaction(
          account,
          transaction
        );

        if (aminoMsgs.length === 0 || protoMsgs.length === 0) {
          return;
        }

        const feeToEncode = {
          amount: [
            {
              denom: account.currency.units[1].code,
              amount: transaction.fees
                ? (transaction.fees.toNumber().toString() as string)
                : (String(await getEstimatedFees(transaction.mode)) as string),
            },
          ],
          gas: transaction.gas
            ? (transaction.gas.toString() as string)
            : (String(await getEstimatedGas(transaction.mode)) as string),
        };

        const signDoc = makeSignDoc(
          aminoMsgs,
          feeToEncode,
          chainId,
          transaction.memo || "",
          accountNumber.toString(),
          sequence.toString()
        );

        const signResponse = await ledgerSigner.signAmino(
          account.freshAddress,
          signDoc
        );

        const signed_tx_bytes = await postBuildTransaction(
          signResponse,
          protoMsgs
        );

        const signature = Buffer.from(signed_tx_bytes).toString("hex");

        if (cancelled) {
          return;
        }

        o.next({ type: "device-signature-granted" });

        const hash = ""; // resolved at broadcast time
        const accountId = account.id;

        const fee = transaction.fees || new BigNumber(DEFAULT_FEES);
        const extra = { memo: transaction.memo || {} };
        const type: OperationType =
          transaction.mode === "undelegate"
            ? "UNDELEGATE"
            : transaction.mode === "delegate"
            ? "DELEGATE"
            : transaction.mode === "redelegate"
            ? "REDELEGATE"
            : ["claimReward", "claimRewardCompound"].includes(transaction.mode)
            ? "REWARD"
            : "OUT";

        const senders: string[] = [];
        const recipients: string[] = [];

        if (transaction.mode === "send") {
          senders.push(account.freshAddress);
          recipients.push(transaction.recipient);
        }

        if (transaction.mode === "redelegate") {
          Object.assign(extra, {
            sourceValidator: transaction.sourceValidator,
          });
        }

        if (transaction.mode !== "send") {
          Object.assign(extra, {
            validators: transaction.validators,
          });
        }

        // build optimistic operation
        const operation: Operation = {
          id: encodeOperationId(accountId, hash, type),
          hash,
          type,
          value: transaction.amount, // Note: prepareTransaction already takes care of setting the correct tx amount (w/ fees) if useAllAmount is selected
          fee,
          extra,
          blockHash: null,
          blockHeight: null,
          senders,
          recipients,
          accountId,
          date: new Date(),
          transactionSequenceNumber: sequence,
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            expirationDate: null,
          },
        });
      }

      main().then(
        () => o.complete(),
        (e) => o.error(e)
      );

      return () => {
        cancelled = true;
      };
    })
  );

export default signOperation;
