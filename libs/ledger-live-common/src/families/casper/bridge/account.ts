import type {
  Account,
  AccountBridge,
  Operation,
  SignOperationEvent,
  BroadcastFnSignature,
  SignOperationFnSignature,
  AccountLike,
} from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";

import { getAccountShape, getPath, isError, motesToCSPR } from "../utils";
import { CLPublicKey, DeployUtil } from "casper-js-sdk";
import BigNumber from "bignumber.js";
import { CASPER_FEES, CASPER_NETWORK, MINIMUM_VALID_AMOUNT } from "../consts";
import {
  getAddress,
  getPubKeySignature,
  validateAddress,
} from "./utils/addresses";
import { log } from "@ledgerhq/logs";
import { Observable } from "rxjs";
import { withDevice } from "../../../hw/deviceAccess";
import { close } from "../../../hw";
import { encodeOperationId } from "../../../operation";
import CasperApp from "@zondax/ledger-casper";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAmountTransfer,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  broadcastTx,
  fetchBalances,
  getAccountStateInfo,
} from "./utils/network";
import { getMainAccount } from "../../../account/helpers";

const receive = makeAccountBridgeReceive();

const createNewDeploy = (
  sender: string,
  recipient?: string,
  amount?: BigNumber,
  network = CASPER_NETWORK
) => {
  log("debug", `Creating new Deploy: ${sender}, ${recipient}, ${network}`);
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
      undefined
    );

  const payment = DeployUtil.standardPayment(CASPER_FEES.toString());
  return DeployUtil.makeDeploy(deployParams, session, payment);
};

const createTransaction = (a: Account): Transaction => {
  // log("debug", "[createTransaction] creating base tx");

  const deploy = createNewDeploy(getAddress(a).address);

  return { family: "casper", deploy, amount: new BigNumber(0), recipient: "" };
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
  const { recipient } = t;

  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    if (
      validateAddress(recipient).isValid &&
      validateAddress(address).isValid
    ) {
      t.recipient = recipient;

      t.deploy = createNewDeploy(address, recipient, t.amount);
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
  else if (!validateAddress(address).isValid)
    errors.sender = new InvalidAddress();

  // This is the worst case scenario (the tx won't cost more than this value)
  const estimatedFees = new BigNumber(CASPER_FEES);

  let totalSpent;
  if (amount.lte(MINIMUM_VALID_AMOUNT))
    errors.amount = new InvalidAmountTransfer(
      `Minimum CSPR to transfer is ${motesToCSPR(
        MINIMUM_VALID_AMOUNT
      ).toNumber()} CSPR`
    );
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
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  const { address } = getAddress(a);

  const recipient = transaction?.recipient;

  if (!validateAddress(address).isValid) throw new InvalidAddress();
  if (recipient && !validateAddress(recipient).isValid)
    throw new InvalidAddress();

  const { purseUref } = await getAccountStateInfo(address);
  if (!purseUref) throw new InvalidAddress();

  const balances = await fetchBalances(purseUref);
  let balance = new BigNumber(balances.balance_value);

  if (balance.eq(0)) return balance;

  const amount = transaction?.amount;

  const estimatedFees = CASPER_FEES;

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  if (amount) balance = balance.minus(estimatedFees);

  // log("debug", "[estimateMaxSpendable] finish fn");

  return balance;
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

          const casper = new CasperApp(transport);

          try {
            o.next({
              type: "device-signature-requested",
            });

            const fee = CASPER_FEES;
            if (useAllAmount) amount = balance.minus(fee);

            transaction = { ...transaction, amount };

            // Serialize tx
            const deployBytes = DeployUtil.deployToBytes(transaction.deploy);

            log(
              "debug",
              `[signOperation] serialized deploy: [${deployBytes.toString()}]`
            );

            // Sign by device
            const result = await casper.sign(
              getPath(derivationPath),
              Buffer.from(deployBytes)
            );
            isError(result);

            o.next({
              type: "device-signature-granted",
            });

            const ledgerPublicKey = await casper.showAddressAndPubKey(
              getPath(derivationPath)
            );
            // signature verification
            const deployHash = transaction.deploy.hash;
            const signature = result.signatureRS;

            const pk = ledgerPublicKey.publicKey;
            // sign deploy object
            const signedDeploy = DeployUtil.setSignature(
              transaction.deploy,
              signature,
              new CLPublicKey(
                pk,
                getPubKeySignature(ledgerPublicKey.Address.toString())
              )
            );
            transaction.deploy = signedDeploy;

            const operation: Operation = {
              id: encodeOperationId(accountId, deployHash.toString(), "OUT"),
              hash: deployHash.toString(),
              type: "OUT",
              senders: [address],
              recipients: [recipient],
              accountId,
              value: amount.plus(fee),
              fee: new BigNumber(CASPER_FEES),
              blockHash: null,
              blockHeight: null,
              date: new Date(),
              extra: {
                deploy: DeployUtil.deployToJson(transaction.deploy),
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

const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation },
}) => {
  // log("debug", "[broadcast] start fn");

  const tx = DeployUtil.deployFromJson(operation.extra.deploy).unwrap();

  // log("debug", `[broadcast] isDeployOk ${DeployUtil.validateDeploy(tx).ok}`);
  const resp = await broadcastTx(tx);
  const { deploy_hash } = resp;

  // const result = patchOperationWithHash(operation, deploy_hash);
  const result = { ...operation, hash: deploy_hash };

  // log("debug", "[broadcast] finish fn");

  return result;
};

const sync = makeSync({ getAccountShape });

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

export { accountBridge };
