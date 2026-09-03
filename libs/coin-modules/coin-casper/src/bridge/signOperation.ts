import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { log } from "@ledgerhq/logs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { Transaction as CasperTransaction } from "casper-js-sdk";
import { Observable } from "rxjs";
import { craftTransaction } from "../logic/craftTransaction";
import { getAddress } from "../logic/validateAddress";
import { tagSignature } from "../signer/deviceResponse";
import { Transaction } from "../types";
import { CasperSigner } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

export const buildSignOperation =
  (
    signerContext: SignerContext<CasperSigner>,
  ): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        // log("debug", "[signOperation] start fn");

        const { recipient, amount, fees, transferId } = transaction;
        const { address, derivationPath } = getAddress(account);

        const crafted = await craftTransaction(
          {
            intentType: "transaction",
            type: "send",
            sender: address,
            recipient,
            amount: BigInt(amount.toFixed(0)),
            asset: { type: "native" },
            ...(transferId !== undefined && {
              memo: { type: "string" as const, kind: "transferId" as const, value: transferId },
            }),
          },
          fees === null ? undefined : { value: BigInt(fees.toFixed(0)) },
        );
        const casperTx = CasperTransaction.fromJSON(crafted.transaction);

        const txBytes = casperTx.toBytes();
        log("debug", `[signOperation] serialized transaction: [${txBytes.toString()}]`);
        o.next({
          type: "device-signature-requested",
        });

        const { r } = await signerContext(deviceId, async signer => ({
          r: await signer.sign(derivationPath, Buffer.from(txBytes)),
        }));

        o.next({
          type: "device-signature-granted",
        });

        const txHash = casperTx.hash.getHash()?.toHex() ?? "";
        const signature = tagSignature(r.signatureRS);

        const operation = buildOptimisticOperation(account, transaction, txHash);
        const txJson = casperTx.toJSON();

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            rawData: {
              tx: JSON.stringify(txJson),
            },
          },
        });
      }
      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
