import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { SignOperationEvent, SignOperationFnSignature, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import {
  claimRewardTronTransaction,
  createTronTransaction,
  freezeTronTransaction,
  legacyUnfreezeTronTransaction,
  unDelegateResourceTransaction,
  unfreezeTronTransaction,
  voteTronSuperRepresentatives,
  withdrawExpireUnfreezeTronTransaction,
} from "../network";
import { Transaction, TronAccount, TronSigner } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import getEstimatedFees from "./getEstimateFees";

export const buildSignOperation =
  (signerContext: SignerContext<TronSigner>): SignOperationFnSignature<Transaction, TronAccount> =>
  ({ account, transaction, deviceId }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        const subAccount =
          transaction.subAccountId && account.subAccounts
            ? account.subAccounts.find(sa => sa.id === transaction.subAccountId)
            : undefined;
        const fee = await getEstimatedFees(account, transaction, subAccount);
        const balance = subAccount
          ? subAccount.balance
          : BigNumber.max(0, account.spendableBalance.minus(fee));

        if (transaction.useAllAmount) {
          transaction = { ...transaction }; // transaction object must not be mutated
          transaction.amount = balance; // force the amount to be the max
        }

        const {
          raw_data_hex: rawDataHex,
          raw_data: rawData,
          txID: hash,
        } = await prepareTransactionForSignature(account, subAccount, transaction);

        o.next({
          type: "device-signature-requested",
        });

        const txArg = {
          rawDataHex,
          // only for trc10, we need to put the token ledger signature
          tokenSignature:
            subAccount &&
            subAccount.type === "TokenAccount" &&
            subAccount.token.id.includes("trc10")
              ? subAccount.token.ledgerSignature
              : undefined,
        };

        // Sign by device
        const signature = await signerContext(deviceId, signer =>
          signer.sign(
            account.freshAddressPath,
            txArg.rawDataHex ?? "", //FIXME: why rawDataHex could be undefined? This shouldn't be the case.
            txArg.tokenSignature ? [txArg.tokenSignature] : [],
          ),
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
    });

// Should we keep this here or move it?
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
