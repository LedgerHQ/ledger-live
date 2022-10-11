import BlockstackApp from "@zondax/ledger-stacks";
import { c32address } from "c32check";
import { StacksMainnet } from "@stacks/network";
import { BigNumber } from "bignumber.js";
import BN from "bn.js";
import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired
} from "@ledgerhq/errors";
import {
  AddressVersion,
  TransactionVersion,
  AnchorMode,
  UnsignedTokenTransferOptions,
  estimateTransfer,
  makeUnsignedSTXTokenTransfer
} from "@stacks/transactions";
import { getNonce, txidFromData } from "@stacks/transactions";

import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  Operation,
  SignOperationEvent,
  SignOperationFnSignature
} from "@ledgerhq/types-live";

import { StacksNetwork } from "./utils/types";
import { Transaction, TransactionStatus } from "../types";
import { getAccountShape, getTxToBroadcast } from "./utils/utils";
import { broadcastTx } from "./utils/api";
import { getAddress } from "../../filecoin/bridge/utils/utils";
import { withDevice } from "../../../hw/deviceAccess";
import { close } from "../../../hw";
import { getPath, isError } from "../utils";
import { decodeAccountId, getMainAccount } from "../../../account";
import { fetchBalances } from "./utils/api";
import { encodeOperationId, patchOperationWithHash } from "../../../operation";
import { validateAddress } from "./utils/addresses";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");

  return {
    family: "stacks",
    recipient: "",
    amount: new BigNumber(0),
    network: "mainnet",
    anchorMode: AnchorMode.Any,
    useAllAmount: false
  };
};

const updateTransaction = (t: Transaction, patch: Transaction): Transaction => {
  // log("debug", "[updateTransaction] patching tx");

  return { ...t, ...patch };
};

const sync = makeSync({ getAccountShape });

const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation, signature }
}) => {
  // log("debug", "[broadcast] start fn");

  const tx = await getTxToBroadcast(operation, signature);

  const hash = await broadcastTx(tx);
  const result = patchOperationWithHash(operation, hash);

  // log("debug", "[broadcast] finish fn");

  return result;
};

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  // log("debug", "[getTransactionStatus] start fn");

  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount, fee } = t;
  let { amount } = t;

  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!validateAddress(recipient).isValid)
    errors.recipient = new InvalidAddress();
  else if (address === recipient)
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  else if (!fee || fee.eq(0)) errors.gas = new FeeNotLoaded();

  const estimatedFees = fee || new BigNumber(0);

  const totalSpent = useAllAmount ? balance : amount.plus(estimatedFees);
  amount = useAllAmount ? balance.minus(estimatedFees) : amount;

  if (amount.lte(0)) errors.amount = new AmountRequired();
  if (totalSpent.gt(a.spendableBalance)) errors.amount = new NotEnoughBalance();

  // log("debug", "[getTransactionStatus] finish fn");

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent
  };
};

const estimateMaxSpendable = async ({
  account,
  parentAccount
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  const { address } = getAddress(a);

  const balance = await fetchBalances(address);
  return new BigNumber(balance.balance); // FIXME Stacks - minus the tx fee from this
};

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");

  const { id: accountID } = a;
  const { recipient } = t;
  const { xpubOrAddress: xpub } = decodeAccountId(accountID);

  if (xpub && recipient && validateAddress(recipient).isValid) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    const network = StacksNetwork[t.network] || new StacksMainnet();

    // Check if recipient is valid
    const options: UnsignedTokenTransferOptions = {
      recipient,
      anchorMode: t.anchorMode,
      memo: t.memo,
      network,
      publicKey: xpub,
      amount: new BN(t.amount.toFixed())
    };

    const tx = await makeUnsignedSTXTokenTransfer(options);

    const addressVersion =
      network.version === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;
    const senderAddress = c32address(
      addressVersion,
      tx.auth.spendingCondition!.signer
    );

    const nonce = await getNonce(senderAddress, options.network);
    const fee = await estimateTransfer(tx);

    t.fee = new BigNumber(fee.toString());
    t.nonce = new BigNumber(nonce.toString());
  }

  // log("debug", "[prepareTransaction] finish fn");

  return t;
};

const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { id: accountId, balance } = account;
          const { address, derivationPath } = getAddress(account);
          const { xpubOrAddress: xpub } = decodeAccountId(accountId);

          const {
            recipient,
            fee,
            useAllAmount,
            anchorMode,
            network,
            memo
          } = transaction;
          let { amount, nonce } = transaction;

          if (!xpub) {
            log("debug", `signOperation missingData --> xpub=${xpub} `);
            throw new InvalidAddress();
          }

          if (!fee) {
            log("debug", `signOperation missingData --> fee=${fee} `);
            throw new FeeNotLoaded();
          }

          if (!nonce) nonce = new BigNumber(0);

          const blockstack = new BlockstackApp(transport);

          try {
            o.next({
              type: "device-signature-requested"
            });

            if (useAllAmount) amount = balance.minus(fee);

            const options: UnsignedTokenTransferOptions = {
              amount: new BN(amount.toFixed()),
              recipient,
              anchorMode,
              network: StacksNetwork[network],
              memo,
              publicKey: xpub,
              fee: new BN(fee.toFixed()),
              nonce: new BN(nonce.toFixed())
            };

            const tx = await makeUnsignedSTXTokenTransfer(options);

            log("debug", `[signOperation] unsigned tx: [${tx}]`);

            const serializedTx = tx.serialize();

            log(
              "debug",
              `[signOperation] serialized tx: [${serializedTx.toString("hex")}]`
            );

            // Sign by device
            const result = await blockstack.sign(
              getPath(derivationPath),
              serializedTx
            );
            isError(result);

            o.next({
              type: "device-signature-granted"
            });

            const txHash = "";

            // build signature on the correct format
            const signature = `${result.signatureVRS.toString("hex")}`;

            const operation: Operation = {
              id: encodeOperationId(accountId, txHash, "OUT"),
              hash: txHash,
              type: "OUT",
              senders: [address],
              recipients: [recipient],
              accountId,
              value: amount.plus(fee),
              fee,
              blockHash: null,
              blockHeight: null,
              date: new Date(),
              extra: {
                nonce,
                xpub,
                network,
                anchorMode,
                signatureType: 1
              }
            };

            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature,
                expirationDate: null
              }
            });
          } finally {
            close(transport, deviceId);

            // log("debug", "[signOperation] finish fn");
          }
        }

        main().then(
          () => o.complete(),
          e => o.error(e)
        );
      })
  );

export const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  estimateMaxSpendable,
  signOperation,
  sync,
  receive,
  broadcast
};
