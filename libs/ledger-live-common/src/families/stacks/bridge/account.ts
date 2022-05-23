import BlockstackApp from "@zondax/ledger-blockstack";
import { c32address } from "c32check";
import { getNonce } from "@stacks/transactions/dist/builders";
import { txidFromData } from "@stacks/transactions/dist/utils";
import { StacksNetwork, StacksMainnet } from "@stacks/network/dist";
import { log } from "@ledgerhq/logs";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  AnchorMode,
  UnsignedTokenTransferOptions,
  estimateTransfer,
  makeUnsignedSTXTokenTransfer,
} from "@stacks/transactions/dist";
import {
  AddressVersion,
  TransactionVersion,
} from "@stacks/transactions/dist/constants";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";

import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  Operation,
  SignOperationEvent,
  SignOperationFnSignature,
  TransactionStatus,
} from "../../../types";
import { Transaction } from "../types";
import { getAccountShape, getTxToBroadcast } from "./utils/utils";
import { broadcastTx } from "./utils/api";
import { getAddress } from "../../filecoin/bridge/utils/utils";
import { withDevice } from "../../../hw/deviceAccess";
import { close } from "../../../hw";
import { getPath, isError } from "../utils";
import { getMainAccount } from "../../../account";
import { fetchBalances } from "./utils/api";
import { patchOperationWithHash } from "../../../operation";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");

  return {
    family: "stacks",
    recipient: "",
    amount: new BigNumber(0),
    network: "mainnet",
    anchorMode: AnchorMode.Any,
    useAllAmount: false,
  };
};

const updateTransaction = (t: Transaction, patch: Transaction): Transaction => {
  // log("debug", "[updateTransaction] patching tx");

  return { ...t, ...patch };
};

const sync = makeSync(getAccountShape);

const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation, signature },
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
  else if (address === recipient)
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  else if (!fee || fee.eq(0)) errors.gas = new FeeNotLoaded();

  // FIXME Stacks - validate addresses if it is possible

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
    totalSpent,
  };
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
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

  const { xpub } = a;
  const { recipient } = t;

  if (recipient && xpub) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    const options: UnsignedTokenTransferOptions = {
      recipient,
      anchorMode: t.anchorMode,
      memo: t.memo,
      network: t.network,
      publicKey: xpub,
      amount: t.amount.toFixed(),
      fee: -1, // Set fee to avoid makeUnsignedSTXTokenTransfer to fetch fees internally
      nonce: -1, // Set nonce to avoid makeUnsignedSTXTokenTransfer to fetch nonce internally
    };

    const tx = await makeUnsignedSTXTokenTransfer(options);
    const network = StacksNetwork.fromNameOrNetwork(
      t.network || new StacksMainnet()
    );

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
  transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    (transport) =>
      new Observable((o) => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { id: accountId, balance, xpub } = account;
          const { address, derivationPath } = getAddress(account);

          const { recipient, fee, useAllAmount, anchorMode, network, memo } =
            transaction;
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
              type: "device-signature-requested",
            });

            if (useAllAmount) amount = balance.minus(fee);

            const options: UnsignedTokenTransferOptions = {
              amount: amount.toFixed(),
              recipient,
              anchorMode,
              network,
              memo,
              publicKey: xpub,
              fee: fee.toString(),
              nonce: nonce.toString(),
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
              type: "device-signature-granted",
            });

            const txHash = txidFromData(serializedTx);

            // build signature on the correct format
            const signature = `${result.signatureVRS.toString("hex")}`;

            const operation: Operation = {
              id: `${accountId}-${txHash}-OUT`,
              hash: txHash,
              type: "OUT",
              senders: [address],
              recipients: [recipient],
              accountId,
              value: amount,
              fee,
              blockHash: null,
              blockHeight: null,
              date: new Date(),
              extra: {
                nonce,
                xpub,
                network,
                anchorMode,
                signatureType: 1,
              },
            };

            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature,
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

export const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  estimateMaxSpendable,
  signOperation,
  sync,
  receive,
  broadcast,
};
