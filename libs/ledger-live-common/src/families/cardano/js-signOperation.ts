import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";

import type { CardanoAccount, CardanoResources, Transaction } from "./types";

import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";

import { buildTransaction } from "./js-buildTransaction";

import Ada, {
  Networks,
  SignTransactionRequest,
  TransactionSigningMode,
  TxAuxiliaryDataType,
  Witness,
} from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { types as TyphonTypes, Transaction as TyphonTransaction } from "@stricahq/typhonjs";
import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import {
  getExtendedPublicKeyFromHex,
  getOperationType,
  prepareLedgerInput,
  prepareLedgerOutput,
} from "./logic";
import ShelleyTypeAddress from "@stricahq/typhonjs/dist/address/ShelleyTypeAddress";
import { getNetworkParameters } from "./networks";
import { MEMO_LABEL } from "./constants";
import { Account, Operation, SignedOperation, SignOperationEvent } from "@ledgerhq/types-live";

const buildOptimisticOperation = (
  account: CardanoAccount,
  transaction: TyphonTransaction,
  t: Transaction,
): Operation => {
  const cardanoResources = account.cardanoResources as CardanoResources;
  const accountCreds = new Set(
    [...cardanoResources.externalCredentials, ...cardanoResources.internalCredentials].map(
      cred => cred.key,
    ),
  );

  const accountInput = transaction
    .getInputs()
    .reduce(
      (total, i) =>
        accountCreds.has(i.address.paymentCredential.hash) ? total.plus(i.amount) : total.plus(0),
      new BigNumber(0),
    );

  const accountOutput = transaction
    .getOutputs()
    .reduce(
      (total, o) =>
        o.address instanceof ShelleyTypeAddress &&
        accountCreds.has(o.address.paymentCredential.hash)
          ? total.plus(o.amount)
          : total.plus(0),
      new BigNumber(0),
    );

  const accountChange = accountOutput.minus(accountInput);
  const opType = getOperationType({
    valueChange: accountChange,
    fees: transaction.getFee(),
  });
  const transactionHash = transaction.getTransactionHash().toString("hex");
  const auxiliaryData = transaction.getAuxiliaryData();
  let memo;
  if (auxiliaryData) {
    const memoMetadata = auxiliaryData.metadata.find(m => m.label === MEMO_LABEL);
    if (memoMetadata && memoMetadata.data instanceof Map) {
      const msg = memoMetadata.data.get("msg");
      if (Array.isArray(msg) && msg.length) {
        memo = msg.join(", ");
      }
    }
  }

  const extra = {};
  if (memo) {
    extra["memo"] = memo;
  }
  const op: Operation = {
    id: encodeOperationId(account.id, transactionHash, opType),
    hash: transactionHash,
    type: opType,
    value: accountChange.absoluteValue(),
    fee: transaction.getFee(),
    blockHash: undefined,
    blockHeight: null,
    senders: transaction.getInputs().map(i => i.address.getBech32()),
    recipients: transaction.getOutputs().map(o => o.address.getBech32()),
    accountId: account.id,
    date: new Date(),
    extra: extra,
  };

  const tokenAccount = t.subAccountId
    ? account.subAccounts?.find(ta => ta.id === t.subAccountId)
    : null;

  if (tokenAccount && opType === "OUT") {
    op.subOperations = [
      {
        id: encodeOperationId(tokenAccount.id, transactionHash, opType),
        hash: transactionHash,
        type: opType,
        value: t.useAllAmount ? tokenAccount.balance : t.amount,
        fee: t.fees as BigNumber,
        blockHash: undefined,
        blockHeight: null,
        senders: transaction.getInputs().map(i => i.address.getBech32()),
        recipients: transaction.getOutputs().map(o => o.address.getBech32()),
        accountId: tokenAccount.id,
        date: new Date(),
        extra: {},
      },
    ];
  }

  return op;
};

/**
 * Adds signatures to unsigned transaction
 */
const signTx = (
  unsignedTransaction: TyphonTransaction,
  accountKey: Bip32PublicKey,
  witnesses: Array<Witness>,
) => {
  witnesses.forEach(witness => {
    const [, , , chainType, index] = witness.path;
    const publicKey = accountKey.derive(chainType).derive(index).toPublicKey().toBytes();
    const vKeyWitness: TyphonTypes.VKeyWitness = {
      signature: Buffer.from(witness.witnessSignatureHex, "hex"),
      publicKey: Buffer.from(publicKey),
    };
    unsignedTransaction.addWitness(vKeyWitness);
  });

  return unsignedTransaction.buildTransaction();
};

/**
 * Sign Transaction with Ledger hardware
 */
const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: string;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          o.next({ type: "device-signature-requested" });

          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }

          const unsignedTransaction = await buildTransaction(
            account as CardanoAccount,
            transaction,
          );

          const accountPubKey = getExtendedPublicKeyFromHex(account.xpub as string);

          const rawInputs = unsignedTransaction.getInputs();
          const ledgerAppInputs = rawInputs.map(i => prepareLedgerInput(i, account.index));

          const rawOutptus = unsignedTransaction.getOutputs();
          const ledgerAppOutputs = rawOutptus.map(o => prepareLedgerOutput(o, account.index));

          const auxiliaryDataHashHex = unsignedTransaction.getAuxiliaryDataHashHex();

          const networkParams = getNetworkParameters(account.currency.id);
          const network =
            networkParams.networkId === Networks.Mainnet.networkId
              ? Networks.Mainnet
              : Networks.Testnet;

          const trxOptions: SignTransactionRequest = {
            signingMode: TransactionSigningMode.ORDINARY_TRANSACTION,
            tx: {
              network,
              inputs: ledgerAppInputs,
              outputs: ledgerAppOutputs,
              certificates: [],
              withdrawals: [],
              fee: unsignedTransaction.getFee().toString(),
              ttl: unsignedTransaction.getTTL()?.toString(),
              validityIntervalStart: null,
              auxiliaryData: auxiliaryDataHashHex
                ? {
                    type: TxAuxiliaryDataType.ARBITRARY_HASH,
                    params: {
                      hashHex: auxiliaryDataHashHex,
                    },
                  }
                : null,
            },
            additionalWitnessPaths: [],
          };

          // Sign by device
          const appAda = new Ada(transport);
          const r = await appAda.signTransaction(trxOptions);
          const signed = signTx(unsignedTransaction, accountPubKey, r.witnesses);

          o.next({ type: "device-signature-granted" });

          const operation = buildOptimisticOperation(
            account as CardanoAccount,
            unsignedTransaction,
            transaction,
          );

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signed.payload,
              expirationDate: null,
            } as SignedOperation,
          });
        }
        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

export default signOperation;
