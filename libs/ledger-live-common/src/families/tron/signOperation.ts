import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import { AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { TronSendTrc20ToNewAccountForbidden } from "./errors";
import signTransaction from "../../hw/signTransaction";
import { Transaction, TronAccount } from "./types";
import { withDevice } from "../../hw/deviceAccess";
import { getEstimatedFees } from "./logic";
import {
  claimRewardTronTransaction,
  createTronTransaction,
  fetchTronAccount,
  fetchTronContract,
  freezeTronTransaction,
  legacyUnfreezeTronTransaction,
  unDelegateResourceTransaction,
  unfreezeTronTransaction,
  voteTronSuperRepresentatives,
  withdrawExpireUnfreezeTronTransaction,
} from "./api";

export const signOperation: AccountBridge<Transaction, TronAccount>["signOperation"] = ({
  account,
  transaction,
  deviceId,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          const subAccount = transaction.subAccountId
            ? account.subAccounts?.find(sa => sa.id === transaction.subAccountId)
            : undefined;
          const isContractAddressRecipient = !!(await fetchTronContract(transaction.recipient));
          const fee = await getEstimatedFees(account, transaction, isContractAddressRecipient);
          const balance = subAccount
            ? subAccount.balance
            : BigNumber.max(0, account.spendableBalance.minus(fee));

          if (transaction.useAllAmount) {
            transaction = { ...transaction }; // transaction object must not be mutated
            transaction.amount = balance; // force the amount to be the max
          }

          // send trc20 to a new account is forbidden by us (because it will not activate the account)
          if (
            transaction.recipient &&
            transaction.mode === "send" &&
            subAccount &&
            subAccount.type === "TokenAccount" &&
            subAccount.token.tokenType === "trc20" &&
            !isContractAddressRecipient && // send trc20 to a smart contract is allowed
            (await fetchTronAccount(transaction.recipient)).length === 0
          ) {
            throw new TronSendTrc20ToNewAccountForbidden();
          }

          const {
            raw_data_hex: rawDataHex,
            raw_data: rawData,
            txID: hash,
          } = await prepareTransactionForSignature(account, subAccount, transaction);

          o.next({
            type: "device-signature-requested",
          });

          // Sign by device
          const signature = await signTransaction(
            account.currency,
            transport,
            account.freshAddressPath,
            {
              rawDataHex,
              // only for trc10, we need to put the token ledger signature
              tokenSignature:
                subAccount &&
                subAccount.type === "TokenAccount" &&
                subAccount.token.id.includes("trc10")
                  ? subAccount.token.ledgerSignature
                  : undefined,
            },
          );
          o.next({
            type: "device-signature-granted",
          });

          const operation = buildOptimisticOperation(account, subAccount, transaction, fee, hash);

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
              rawData,
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

const prepareTransactionForSignature = (
  account: TronAccount,
  subAccount: TokenAccount | undefined,
  transaction: Transaction,
) => {
  switch (transaction.mode) {
    case "freeze":
      return freezeTronTransaction(account, transaction);

    case "unfreeze":
      return unfreezeTronTransaction(account, transaction);

    case "vote":
      return voteTronSuperRepresentatives(account, transaction);

    case "claimReward":
      return claimRewardTronTransaction(account);

    case "withdrawExpireUnfreeze":
      return withdrawExpireUnfreezeTronTransaction(account, transaction);

    case "unDelegateResource":
      return unDelegateResourceTransaction(account, transaction);

    case "legacyUnfreeze":
      return legacyUnfreezeTronTransaction(account, transaction);

    default:
      return createTronTransaction(account, transaction, subAccount);
  }
};
