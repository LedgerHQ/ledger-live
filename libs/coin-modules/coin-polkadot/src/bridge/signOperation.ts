/* eslint-disable no-console */
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { signExtrinsic } from "../logic";
import polkadotAPI from "../network";
import type { PolkadotAccount, PolkadotSigner, Transaction } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { calculateAmount } from "./utils";

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
        const { unsigned, registry } = await buildTransaction(account, transactionToSign);
        const payload = registry
          .createType("ExtrinsicPayload", unsigned, {
            version: unsigned.version,
          })
          .toU8a({
            method: true,
          });
        const currency = getCryptoCurrencyById(account.currency.id);
        const payloadString = Buffer.from(payload).toString("hex");
        const metadata = await polkadotAPI.shortenMetadata(payloadString, currency);
        const r = await signerContext(deviceId, signer =>
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
