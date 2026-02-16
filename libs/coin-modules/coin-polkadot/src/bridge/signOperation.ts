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
        // Decompose the ExtrinsicPayload into its three parts for the sidecar metadata-blob endpoint
        // payload = callData ++ includedInExtrinsic (extra) ++ includedInSignedData (additional_signed)
        const callData = unsigned.method;
        // includedInSignedData: concatenation of all signed extensions' additional_signed() outputs
        // = specVersion(u32) ++ txVersion(u32) ++ genesisHash(H256) ++ blockHash(H256) ++ Option<metadataHash>
        const includedInSignedData =
          "0x" +
          unsigned.specVersion.slice(2) +
          unsigned.transactionVersion.slice(2) +
          unsigned.genesisHash.slice(2) +
          unsigned.blockHash.slice(2) +
          Buffer.from(unsigned.metadataHash).toString("hex");

        // includedInExtrinsic: the signed extension extra data (era, nonce, tip, asset_id, mode)
        // Extracted from the payload by removing the callData prefix and includedInSignedData suffix
        const callDataBytesLength = (callData.length - 2) / 2;
        const additionalSignedBytesLength = (includedInSignedData.length - 2) / 2;
        const extraBytes = payload.slice(
          callDataBytesLength,
          payload.length - additionalSignedBytesLength,
        );
        const includedInExtrinsic = "0x" + Buffer.from(extraBytes).toString("hex");

        const metadata = await polkadotAPI.shortenMetadata(
          callData,
          includedInExtrinsic,
          includedInSignedData,
          currency,
        );
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
