import { Observable } from "rxjs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Transaction, HederaSigner } from "../types";
import { HEDERA_OPERATION_TYPES } from "../constants";
import { isTokenAssociateTransaction } from "../logic";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { AssetInfo } from "@ledgerhq/coin-framework/api/types";

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

          const accountAddress = account.freshAddress;
          const accountPublicKey = account.seedIdentifier;
          const subAccount = findSubAccountById(account, transaction.subAccountId || "");
          const isTokenTransaction = isTokenAccount(subAccount);

          let type;
          let asset: AssetInfo;

          if (isTokenAssociateTransaction(transaction) && subAccount) {
            type = HEDERA_OPERATION_TYPES.TokenAssociate;
            asset = {
              type: "token",
              assetReference: subAccount.token.contractAddress,
              assetOwner: accountAddress,
            };
          } else if (isTokenTransaction) {
            type = HEDERA_OPERATION_TYPES.TokenTransfer;
            asset = {
              type: "token",
              assetReference: subAccount.token.contractAddress,
              assetOwner: accountAddress,
            };
          } else {
            type = HEDERA_OPERATION_TYPES.CryptoTransfer;
            asset = {
              type: "native",
            };
          }

          const signedTx = await signerContext(deviceId, async signer => {
            const { tx } = await craftTransaction({
              type,
              asset,
              amount: BigInt(transaction.amount.toString()),
              sender: accountAddress,
              recipient: transaction.recipient,
              memo: {
                type: "string",
                kind: "memo",
                value: transaction.memo ?? "",
              },
            });
            const txBytes = tx.toBytes();
            const signatureBytes = await signer.signTransaction(txBytes);

            return combine(
              Buffer.from(txBytes).toString("hex"),
              Buffer.from(signatureBytes).toString("base64"),
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
              // NOTE: this needs to match the inverse operation in js-broadcast
              signature: Buffer.from(signedTx, "hex").toString("base64"),
            },
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
