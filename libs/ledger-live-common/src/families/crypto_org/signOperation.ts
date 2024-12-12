import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { utils } from "@crypto-org-chain/chain-jslib";
import { FeeNotLoaded } from "@ledgerhq/errors";
import CryptoOrgApp from "@ledgerhq/hw-app-cosmos";
import { CryptoOrgWrongSignatureHeader, CryptoOrgSignatureSize } from "./errors";
import type { Transaction } from "./types";
import type { AccountBridge } from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import { buildTransaction } from "./buildTransaction";
import { isTestNet } from "./logic";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

/**
 * Sign Transaction with Ledger hardware
 */
export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          o.next({
            type: "device-signature-requested",
          });

          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }

          // Get the public key
          const hwApp = new CryptoOrgApp(transport);
          const cointype = isTestNet(account.currency.id) ? "tcro" : "cro";
          const { publicKey } = await hwApp.getAddress(account.freshAddressPath, cointype, false);
          const unsigned = await buildTransaction(account, transaction, publicKey);
          // Sign by device
          const { signature } = await hwApp.sign(
            account.freshAddressPath,
            unsigned.toSignDocument(0).toUint8Array(),
          );

          // Ledger has encoded the sig in ASN1 DER format, but we need a 64-byte buffer of <r,s>
          // DER-encoded signature from Ledger
          if (signature != null) {
            const base64Sig = convertASN1toBase64(signature);
            const signed = unsigned
              .setSignature(0, utils.Bytes.fromUint8Array(new Uint8Array(base64Sig)))
              .toSigned()
              .getHexEncoded();
            o.next({
              type: "device-signature-granted",
            });
            const operation = buildOptimisticOperation(
              account,
              transaction,
              transaction.fees ?? new BigNumber(0),
            );
            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature: signed,
              },
            });
          }
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

function convertASN1toBase64(signature) {
  // 0 0x30: a header byte indicating a compound structure
  // 1 A 1-byte length descriptor for all what follows (ignore)
  // 2 0x02: a header byte indicating an integer
  // 3 A 1-byte length descriptor for the R value
  // 4 The R coordinate, as a big-endian integer
  //   0x02: a header byte indicating an integer
  //   A 1-byte length descriptor for the S value
  //   The S coordinate, as a big-endian integer
  //  = 7 bytes of overhead
  if (signature[0] !== 0x30) {
    throw new CryptoOrgWrongSignatureHeader();
  }

  // decode DER string format
  const rOffset = 4;
  const rLen = signature[3];
  const sLen = signature[4 + rLen + 1]; // skip over following 0x02 type prefix for s

  const sOffset = signature.length - sLen;
  const sigR = signature.slice(rOffset, rOffset + rLen); // skip e.g. 3045022100 and pad

  const sigS = signature.slice(sOffset);
  const newSigR = padZero(sigR, 32);
  const newSigS = padZero(sigS, 32);

  const signatureFormatted = Buffer.concat([newSigR, newSigS]);

  if (signatureFormatted.length !== 64) {
    throw new CryptoOrgSignatureSize();
  }

  return signatureFormatted;
}

function padZero(original_array: Uint8Array, wanted_length: number) {
  const new_array = new Uint8Array(wanted_length);

  for (let i = wanted_length - 1; i >= 0; i--) {
    const j = wanted_length - 1 - i;
    const new_i = original_array.length - 1 - j;

    if (new_i >= 0 && new_i < original_array.length) {
      new_array[i] = original_array[new_i];
    } else {
      new_array[i] = 0;
    }
  }

  return new_array;
}

export default signOperation;
