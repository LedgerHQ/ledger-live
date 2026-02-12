import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Account, AccountBridge, Operation } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { getAddress, getSubAccount } from "../common-logic/utils";
import { Transaction, FilecoinSigner } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { toCBOR } from "./serializer";
import { AccountType } from "./utils";

export const buildSignOperation =
  (
    signerContext: SignerContext<FilecoinSigner>,
  ): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { method, version, nonce, gasFeeCap, gasLimit, gasPremium } = transaction;
        const { derivationPath } = getAddress(account);
        const subAccount = getSubAccount(account, transaction);
        const tokenAccountTxn = subAccount?.type === AccountType.TokenAccount;

        if (!gasFeeCap.gt(0) || !gasLimit.gt(0)) {
          log("debug", `signOperation missingData --> gasFeeCap=${gasFeeCap} gasLimit=${gasLimit}`);
          throw new FeeNotLoaded();
        }

        o.next({
          type: "device-signature-requested",
        });

        // Serialize tx
        const toCBORResponse = await toCBOR(account, transaction);
        const {
          txPayload,
          parsedSender,
          recipientToBroadcast,
          encodedParams,
          amountToBroadcast: finalAmount,
        } = toCBORResponse;

        log("debug", `[signOperation] serialized CBOR tx: [${txPayload.toString("hex")}]`);

        // Sign by device
        const { r } = await signerContext(deviceId, async signer => {
          const r = await signer.sign(derivationPath, txPayload);
          return { r };
        });

        o.next({
          type: "device-signature-granted",
        });

        if (!r.signature_compact) {
          throw new Error("Signature compact is null");
        }
        // build signature on the correct format
        const signature = `${Buffer.from(r.signature_compact).toString("base64")}`;

        const operation: Operation = await buildOptimisticOperation(
          account,
          transaction,
          toCBORResponse,
        );

        // Necessary for broadcast
        const additionalTxFields = {
          sender: parsedSender,
          recipient: recipientToBroadcast,
          params: encodedParams,
          gasLimit,
          gasFeeCap,
          gasPremium,
          method,
          version,
          nonce,
          signatureType: 1,
          tokenTransfer: tokenAccountTxn,
          value: finalAmount.toString(),
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            rawData: additionalTxFields,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
