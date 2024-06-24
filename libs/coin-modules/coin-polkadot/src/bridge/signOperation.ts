import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { PolkadotAccount, PolkadotSigner, Transaction } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { calculateAmount } from "./utils";
import { signExtrinsic } from "../logic";
import polkadotAPI from "../network";
import coinConfig from "../config";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<PolkadotSigner>,
  ): AccountBridge<Transaction, PolkadotAccount>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const runtimeUpgraded = coinConfig.getCoinConfig().runtimeUpgraded;
        o.next({
          type: "device-signature-requested",
        });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        // Ensure amount is filled when useAllAmount
        const transactionToSign = {
          ...transaction,
          amount: calculateAmount({
            account,
            transaction,
          }),
        };
        const { unsigned, registry } = await buildTransaction(account, transactionToSign, true);
        const payload = registry
          .createType("ExtrinsicPayload", unsigned, {
            version: unsigned.version,
          })
          .toU8a({
            method: true,
          });
        let metadata = "";
        if (runtimeUpgraded) {
          const payloadString = Buffer.from(payload).toString("hex");
          metadata = await polkadotAPI.shortenMetadata(payloadString);
        }
        const r = await signerContext(deviceId, signer =>
          // FIXME: the type of payload Uint8Array is not compatible with the signature of sign which accept a string
          signer.sign(account.freshAddressPath, payload, metadata),
        );

        const signed = await signExtrinsic(unsigned, r.signature, registry);
        o.next({
          type: "device-signature-granted",
        });
        const operation = buildOptimisticOperation(
          account,
          transactionToSign,
          transactionToSign.fees ?? new BigNumber(0),
        );
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signed,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignOperation;
