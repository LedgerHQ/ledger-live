import { Observable } from "rxjs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { AssetInfo, FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { DEFAULT_GAS_LIMIT, HEDERA_TRANSACTION_MODES } from "../constants";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import {
  serializeSignature,
  serializeTransaction,
  getHederaTransactionBodyBytes,
  isTokenAssociateTransaction,
} from "../logic/utils";
import type { Transaction, HederaSigner, HederaTxData } from "../types";

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
          let data: HederaTxData | undefined;
          const accountAddress = account.freshAddress;
          const accountPublicKey = account.seedIdentifier;
          const subAccount = findSubAccountById(account, transaction.subAccountId || "");
          const isHTSTokenTransaction =
            transaction.mode === HEDERA_TRANSACTION_MODES.Send &&
            subAccount?.token.tokenType === "hts";
          const isERC20TokenTransaction =
            transaction.mode === HEDERA_TRANSACTION_MODES.Send &&
            subAccount?.token.tokenType === "erc20";

          if (isTokenAssociateTransaction(transaction)) {
            type = HEDERA_TRANSACTION_MODES.TokenAssociate;
            asset = {
              type: transaction.properties.token.tokenType,
              assetReference: transaction.properties.token.contractAddress,
            };
          } else if (isHTSTokenTransaction) {
            type = HEDERA_TRANSACTION_MODES.Send;
            asset = {
              type: subAccount.token.tokenType,
              assetReference: subAccount.token.contractAddress,
              assetOwner: accountAddress,
            };
          } else if (isERC20TokenTransaction) {
            type = HEDERA_TRANSACTION_MODES.Send;
            asset = {
              type: subAccount.token.tokenType,
              assetReference: subAccount.token.contractAddress,
              assetOwner: accountAddress,
            };
            data = {
              type: "erc20",
              gasLimit: BigInt((transaction.gasLimit ?? DEFAULT_GAS_LIMIT).toString()),
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
                ...(data && { data }),
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
