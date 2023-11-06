import BlockstackApp from "@zondax/ledger-stacks";
import { c32address } from "c32check";
import { StacksMainnet } from "@stacks/network";
import { BigNumber } from "bignumber.js";
import BN from "bn.js";
import { Observable } from "rxjs";
import invariant from "invariant";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidNonce,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { StacksMemoTooLong } from "../errors";
import {
  AddressVersion,
  TransactionVersion,
  AnchorMode,
  UnsignedTokenTransferOptions,
  estimateTransfer,
  makeUnsignedSTXTokenTransfer,
} from "@stacks/transactions";

import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";

import { StacksNetwork } from "./utils/api.types";
import { StacksOperation, Transaction, TransactionStatus } from "../types";
import { findNextNonce, getAccountShape, getTxToBroadcast } from "./utils/misc";
import { broadcastTx } from "./utils/api";
import { getAddress } from "../../filecoin/bridge/utils/utils";
import { withDevice } from "../../../hw/deviceAccess";
import { getPath, throwIfError } from "../utils";
import { decodeAccountId, getMainAccount } from "../../../account";
import { encodeOperationId, patchOperationWithHash } from "../../../operation";
import { validateAddress } from "./utils/addresses";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => {
  return {
    family: "stacks",
    recipient: "",
    amount: new BigNumber(0),
    network: "mainnet",
    anchorMode: AnchorMode.Any,
    useAllAmount: false,
  };
};

const sync = makeSync({ getAccountShape });

const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation, signature, rawData },
}) => {
  invariant(operation as StacksOperation, "StacksOperation expected");
  const tx = await getTxToBroadcast(operation as StacksOperation, signature, rawData ?? {});

  const hash = await broadcastTx(tx);
  const result = patchOperationWithHash(operation, hash);

  return result;
};

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { spendableBalance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount, fee } = t;
  const { memo } = t;
  let { amount } = t;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!validateAddress(recipient).isValid) {
    errors.recipient = new InvalidAddress();
  } else if (address === recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!fee || fee.eq(0)) {
    errors.gas = new FeeNotLoaded();
  }

  const estimatedFees = fee || new BigNumber(0);

  const totalSpent = useAllAmount ? spendableBalance : amount.plus(estimatedFees);
  amount = useAllAmount ? spendableBalance.minus(estimatedFees) : amount;

  if (amount.lte(0)) errors.amount = new AmountRequired();
  if (totalSpent.gt(spendableBalance)) errors.amount = new NotEnoughBalance();
  if (memo && memo.length > 34) errors.transaction = new StacksMemoTooLong();

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
  const { id: accountId, spendableBalance } = a;
  const { xpubOrAddress: xpub } = decodeAccountId(accountId);

  const dummyTx = {
    ...createTransaction(),
    ...transaction,
    recipient: getAbandonSeedAddress(a.currency.id),
    useAllAmount: true,
  };
  // Compute fees
  const { recipient, anchorMode, memo, amount } = dummyTx;
  const network = StacksNetwork[dummyTx.network] || new StacksMainnet();

  const options: UnsignedTokenTransferOptions = {
    recipient,
    anchorMode,
    memo,
    network,
    publicKey: xpub,
    amount: new BN(amount.toFixed()) as any,
  };

  const tx = await makeUnsignedSTXTokenTransfer(options);

  const fee = await estimateTransfer(tx);

  const diff = spendableBalance.minus(new BigNumber(fee.toString()));
  return diff.gte(0) ? diff : new BigNumber(0);
};

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const { id: accountID, spendableBalance, pendingOperations } = a;
  const { recipient, useAllAmount } = t;
  const { xpubOrAddress: xpub } = decodeAccountId(accountID);

  const patch: Partial<Transaction> = {};
  if (xpub && recipient && validateAddress(recipient).isValid) {
    const { anchorMode, memo, amount } = t;

    const network = StacksNetwork[t.network] || new StacksMainnet();

    // Check if recipient is valid
    const options: UnsignedTokenTransferOptions = {
      recipient,
      anchorMode,
      memo,
      network,
      publicKey: xpub,
      amount: new BN(amount.toFixed()) as any,
    };

    const tx = await makeUnsignedSTXTokenTransfer(options);

    const addressVersion =
      network.version === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;
    const senderAddress = c32address(addressVersion, tx.auth.spendingCondition!.signer);

    const fee = await estimateTransfer(tx);

    patch.fee = new BigNumber(fee.toString());
    patch.nonce = await findNextNonce(senderAddress, pendingOperations);

    if (useAllAmount) patch.amount = spendableBalance.minus(patch.fee);
  }

  return defaultUpdateTransaction(t, patch);
};

const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          const { id: accountId } = account;
          const { address, derivationPath } = getAddress(account);
          const { xpubOrAddress: xpub } = decodeAccountId(accountId);

          const { recipient, fee, anchorMode, network, memo, amount, nonce } = transaction;

          if (!xpub) {
            throw new InvalidAddress();
          }

          if (!fee) {
            throw new FeeNotLoaded();
          }

          if (!nonce) {
            throw new InvalidNonce();
          }

          const blockstack = new BlockstackApp(transport);

          const options: UnsignedTokenTransferOptions = {
            amount: new BN(amount.toFixed()) as any,
            recipient,
            anchorMode,
            network: StacksNetwork[network],
            memo,
            publicKey: xpub,
            fee: new BN(fee.toFixed()) as any,
            nonce: new BN(nonce.toFixed()) as any,
          };

          const tx = await makeUnsignedSTXTokenTransfer(options);

          const serializedTx = tx.serialize();

          o.next({
            type: "device-signature-requested",
          });

          // Sign by device
          const result = await blockstack.sign(getPath(derivationPath), serializedTx);
          throwIfError(result);

          o.next({
            type: "device-signature-granted",
          });

          const txHash = "";

          // build signature on the correct format
          const signature = `${result.signatureVRS.toString("hex")}`;

          const operation: StacksOperation = {
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
            transactionSequenceNumber: nonce.toNumber(),
            extra: {
              memo,
            },
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
              rawData: {
                xpub,
                network,
                anchorMode,
              },
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

export const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  getTransactionStatus,
  prepareTransaction,
  estimateMaxSpendable,
  signOperation,
  sync,
  receive,
  broadcast,
};
