import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  Operation,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "../types";
import { getAccountShape } from "./utils/account";
import BigNumber from "bignumber.js";
import { getEstimatedFees } from "./utils/token";
import { getAddress, validateAddress } from "./utils/addresses";
import { getPath, validateMemo } from "../utils";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import ICPApp from "@zondax/ledger-icp";
import { Observable } from "rxjs";
import { withDevice } from "../../../hw/deviceAccess";
import { close } from "../../../hw";
import {
  broadcastTxn,
  createSubmitRequest,
  createTransformRequest,
  createTxnOptions,
  createTxnRequest,
  generateBlobToSign,
} from "./utils/icp";
import { AccountIdentifier } from "@dfinity/nns";
import { encodeOperationId } from "../../../operation";
import { LedgerIdentity } from "./utils/icp/identity";
import { Secp256k1PublicKey } from "./utils/icp/secp256k1";

const sync = makeSync({ getAccountShape });

const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");
  return {
    family: "dfinity",
    amount: new BigNumber(0),
    fees: getEstimatedFees(),
    recipient: "",
    useAllAmount: false,
    memo: BigInt(0),
  };
};

const updateTransaction = (t: Transaction, patch: Transaction): Transaction => {
  // log("debug", "[updateTransaction] patching tx");

  return { ...t, ...patch };
};

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");

  const { address } = getAddress(a);
  const { recipient, memo } = t;

  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    if (
      validateAddress(recipient).isValid &&
      validateAddress(address).isValid &&
      validateMemo(memo).isValid
    ) {
      if (t.useAllAmount) {
        t.amount = a.spendableBalance.minus(t.fees);
      }
    }
  }

  // log("debug", "[prepareTransaction] finish fn");
  return t;
};

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount } = t;
  let { amount } = t;

  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!validateAddress(recipient).isValid)
    errors.recipient = new InvalidAddress();
  else if (recipient.toLowerCase() === address.toLowerCase())
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();

  if (!validateAddress(address).isValid) errors.sender = new InvalidAddress();

  // This is the worst case scenario (the tx won't cost more than this value)
  const estimatedFees = t.fees;

  let totalSpent: BigNumber;

  if (useAllAmount) {
    totalSpent = a.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (totalSpent.gt(a.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  // log("debug", "[getTransactionStatus] finish fn");

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

const estimateMaxSpendable = async ({
  account,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const balance = account.balance;

  let maxSpendable = balance.minus(transaction?.fees ?? getEstimatedFees());

  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return maxSpendable;
};

const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    (transport) =>
      new Observable((o) => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { recipient, useAllAmount } = transaction;
          let { amount } = transaction;
          const { id: accountId, balance } = account;
          const { address, derivationPath } = getAddress(account);

          const icp = new ICPApp(transport);
          const accountInfo = await icp.getAddressAndPubKey(
            getPath(derivationPath)
          );
          const now = new Date();

          const identity = new LedgerIdentity(
            accountInfo.principalText,
            getPath(derivationPath),
            accountInfo.publicKey,
            transport
          );

          const request = await createTxnRequest({
            to: AccountIdentifier.fromHex(transaction.recipient),
            amount: BigInt(transaction.amount.toString()),
            memo: BigInt(transaction.memo.toString()),
          });
          const requestSerialized = request.serializeBinary();

          try {
            o.next({
              type: "device-signature-requested",
            });

            const fee = transaction.fees;
            if (useAllAmount) amount = balance.minus(fee);

            transaction = { ...transaction, amount };

            // get blob to sign
            const { toSign } = generateBlobToSign(
              createTxnOptions(requestSerialized),
              accountInfo.principalText,
              now
            );

            const signature = await identity.sign(toSign);
            const signatureString = Buffer.from(signature).toString("hex");

            // Serialize tx

            // log(
            //   "debug",
            //   `[signOperation] serialized request: [${Buffer.from(
            //     request.serializeBinary()
            //   ).toString()}]`
            // );

            o.next({
              type: "device-signature-granted",
            });

            const operation: Operation = {
              id: encodeOperationId(accountId, "", "OUT"),
              hash: "",
              type: "OUT",
              senders: [address],
              recipients: [recipient],
              accountId,
              value: amount.plus(fee),
              fee,
              blockHash: null,
              blockHeight: null,
              date: now,
              extra: {
                memo: transaction.memo.toString(),
                request: Buffer.from(requestSerialized).toString("hex"),
                pubkey: accountInfo.publicKey.toString("hex"),
                principalText: accountInfo.principalText,
              },
            };

            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature: signatureString,
                expirationDate: null,
              },
            });
          } finally {
            close(transport, deviceId);

            // log("debug", "[signOperation] finish fn");
          }
        }

        main().then(
          () => o.complete(),
          (e) => o.error(e)
        );
      })
  );

const receive = makeAccountBridgeReceive();

const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation, signature },
}) => {
  // log("debug", "[broadcast] start fn");

  const txSerialized = Buffer.from(operation.extra.request, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  const pubkeyBuf = Buffer.from(operation.extra.pubkey, "hex");

  const options = createTxnOptions(txSerialized);
  const submit = createSubmitRequest(
    options,
    operation.extra.principalText,
    new Date(operation.date)
  );
  const transformedRequest = createTransformRequest(submit);
  const { body, ...fields } = transformedRequest;
  const pubKey = Secp256k1PublicKey.fromRaw(pubkeyBuf);

  const transformedRequestFinal = {
    ...fields,
    body: {
      content: body,
      sender_pubkey: pubKey.toDer(),
      sender_sig: signatureBuf,
    },
  };

  await broadcastTxn(submit, transformedRequestFinal);

  // const result = patchOperationWithHash(operation, deploy_hash);
  const result = { ...operation };

  // log("debug", "[broadcast] finish fn");

  return result;
};

export const accountBridge: AccountBridge<Transaction> = {
  sync,
  updateTransaction,
  createTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  receive,
  signOperation,
  broadcast,
};
