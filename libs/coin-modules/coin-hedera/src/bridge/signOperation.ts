import { Observable } from "rxjs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { AssetInfo, FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { HEDERA_TRANSACTION_MODES } from "../constants";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import {
  serializeSignature,
  serializeTransaction,
  getHederaTransactionBodyBytes,
  isTokenAssociateTransaction,
} from "../logic/utils";
import type { Transaction, HederaSigner } from "../types";

export const buildSignOperation =
  (
    signerContext: SignerContext<HederaSigner>,
  ): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      void (async function () {
        try {
          o.next({
            type: "device-signature-requested",
          });

          let type: Transaction["mode"];
          let asset: AssetInfo;
          const accountAddress = account.freshAddress;
          const accountPublicKey = account.seedIdentifier;
          const subAccount = findSubAccountById(account, transaction.subAccountId || "");
          const isTokenTransaction = isTokenAccount(subAccount);

          if (isTokenAssociateTransaction(transaction)) {
            type = HEDERA_TRANSACTION_MODES.TokenAssociate;
            asset = {
              type: transaction.properties.token.tokenType,
              assetReference: transaction.properties.token.contractAddress,
            };
          } else if (isTokenTransaction) {
            type = HEDERA_TRANSACTION_MODES.Send;
            asset = {
              type: subAccount.token.tokenType,
              assetReference: subAccount.token.contractAddress,
              assetOwner: accountAddress,
            };
          } else {
            type = HEDERA_TRANSACTION_MODES.Send;
            asset = {
              type: "native",
            };
          }

          const customFees: FeeEstimation | undefined = transaction.maxFee
            ? { value: BigInt(transaction.maxFee.toString()) }
            : undefined;

          const signedTx = await signerContext(deviceId, async signer => {
            const { tx } = await craftTransaction(
              {
                intentType: "transaction",
                type,
                asset,
                amount: BigInt(transaction.amount.toString()),
                sender: accountAddress,
                recipient: transaction.recipient,
                memo: {
                  kind: "text",
                  type: "string",
                  value: transaction.memo ?? "",
                },
              },
              customFees,
            );

            const txBodyBytes = getHederaTransactionBodyBytes(tx);
            const signatureBytes = await signer.signTransaction(txBodyBytes);

            return combine(
              serializeTransaction(tx),
              serializeSignature(signatureBytes),
              accountPublicKey,
            );
          });

          o.next({
            type: "device-signature-granted",
          });

          const operation = await buildOptimisticOperation({
            account,
            transaction,
          });

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signedTx,
            },
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
