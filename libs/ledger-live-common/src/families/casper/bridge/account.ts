import type {
  Account,
  AccountBridge,
  SignOperationEvent,
  BroadcastFnSignature,
  SignOperationFnSignature,
  AccountLike,
} from "@ledgerhq/types-live";
import type { CasperOperation, Transaction, TransactionStatus } from "../types";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";

import { getPath, isError } from "../msc-utils";
import { DeployUtil } from "casper-js-sdk";
import BigNumber from "bignumber.js";
import {
  CASPER_MINIMUM_VALID_AMOUNT_MOTES,
  CASPER_MAX_TRANSFER_ID,
  MayBlockAccountError,
  InvalidMinimumAmountError,
} from "../consts";
import { getAddress, casperGetCLPublicKey, isAddressValid } from "./bridgeHelpers/addresses";
import { log } from "@ledgerhq/logs";
import { Observable } from "rxjs";
import { withDevice } from "../../../hw/deviceAccess";
import { encodeOperationId, patchOperationWithHash } from "../../../operation";
import CasperApp from "@zondax/ledger-casper";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { CasperInvalidTransferId } from "../errors";
import { broadcastTx } from "../api";
import { getMainAccount } from "../../../account/helpers";
import { createNewDeploy } from "./bridgeHelpers/txn";
import { getAccountShape } from "./bridgeHelpers/accountShape";
import { getEstimatedFees } from "./bridgeHelpers/fee";
import { isTransferIdValid } from "./bridgeHelpers/transferId";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");

  return {
    family: "casper",
    amount: new BigNumber(0),
    fees: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  };
};

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");
  const fees = getEstimatedFees();

  const amount = t.useAllAmount ? a.spendableBalance.minus(t.fees) : t.amount;

  // log("debug", "[prepareTransaction] finish fn");
  return defaultUpdateTransaction(t, { fees, amount });
};

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance, spendableBalance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount } = t;
  let { amount } = t;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isAddressValid(recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  } else if (recipient.toLowerCase() === address.toLowerCase()) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!isAddressValid(address)) {
    errors.sender = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  } else if (!isTransferIdValid(t.transferId)) {
    errors.sender = new CasperInvalidTransferId("", {
      maxTransferId: CASPER_MAX_TRANSFER_ID,
    });
  }

  const estimatedFees = t.fees;

  let totalSpent = BigNumber(0);

  if (useAllAmount) {
    totalSpent = a.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (!useAllAmount) {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }

    if (totalSpent.gt(a.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (amount.lt(CASPER_MINIMUM_VALID_AMOUNT_MOTES) && !errors.amount) {
    errors.amount = InvalidMinimumAmountError;
  }

  if (
    spendableBalance.minus(totalSpent).minus(estimatedFees).lt(CASPER_MINIMUM_VALID_AMOUNT_MOTES)
  ) {
    warnings.amount = MayBlockAccountError;
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
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  let balance = a.spendableBalance;

  if (balance.eq(0)) return balance;

  const estimatedFees = transaction?.fees ?? getEstimatedFees();

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  // log("debug", "[estimateMaxSpendable] finish fn");

  return balance;
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
          // log("debug", "[signOperation] start fn");

          const { recipient, amount } = transaction;
          const { id: accountId } = account;
          const { address, derivationPath } = getAddress(account);

          const casper = new CasperApp(transport);

          const fee = transaction.fees;

          const deploy = createNewDeploy(
            address,
            recipient,
            transaction.amount,
            transaction.fees,
            transaction.transferId,
          );
          // Serialize tx
          const deployBytes = DeployUtil.deployToBytes(deploy);

          log("debug", `[signOperation] serialized deploy: [${deployBytes.toString()}]`);

          o.next({
            type: "device-signature-requested",
          });

          // Sign by device
          const result = await casper.sign(getPath(derivationPath), Buffer.from(deployBytes));
          isError(result);

          o.next({
            type: "device-signature-granted",
          });

          // signature verification
          const deployHash = deploy.hash.toString();
          const signature = result.signatureRS;

          // sign deploy object
          const signedDeploy = DeployUtil.setSignature(
            deploy,
            signature,
            casperGetCLPublicKey(address),
          );

          const operation: CasperOperation = {
            id: encodeOperationId(accountId, deployHash, "OUT"),
            hash: deployHash,
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
              transferId: transaction.transferId,
            },
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: JSON.stringify(DeployUtil.deployToJson(signedDeploy)),
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

const broadcast: BroadcastFnSignature = async ({ signedOperation: { signature, operation } }) => {
  // log("debug", "[broadcast] start fn");

  const tx = DeployUtil.deployFromJson(JSON.parse(signature)).unwrap();

  // log("debug", `[broadcast] isDeployOk ${DeployUtil.validateDeploy(tx).ok}`);
  const resp = await broadcastTx(tx);
  const { deploy_hash } = resp;

  const result = patchOperationWithHash(operation, deploy_hash);

  // log("debug", "[broadcast] finish fn");

  return result;
};

const sync = makeSync({ getAccountShape });

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

export { accountBridge };
