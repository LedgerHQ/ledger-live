import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { rlpEncodedTx, encodeTransaction } from "@celo/wallet-base";

import { buildOptimisticOperation } from "./buildOptimisticOperation";
import type { Transaction, CeloAccount } from "./types";
import { withDevice } from "../../hw/deviceAccess";
import buildTransaction from "./buildTransaction";
import Celo from "./celo";

/**
 * Sign Transaction with Ledger hardware
 */
export const signOperation: AccountBridge<Transaction, CeloAccount>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        let cancelled;

        async function main() {
          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }

          // TODO need to check legacy token info too, based on what we found in celo dev
          // tooling repo dont legacy prefix token data when providing to the app

          const celo = new Celo(transport);
          const unsignedTransaction = await buildTransaction(account, transaction);
          const { chainId, to } = unsignedTransaction;
          await celo.verifyTokenInfo(to!, chainId!);
          const rlpEncodedTransaction = rlpEncodedTx(unsignedTransaction);

          o.next({ type: "device-signature-requested" });

          const response = await celo.signTransaction(
            account.freshAddressPath,
            trimLeading0x(rlpEncodedTransaction.rlpEncode),
          );

          if (cancelled) return;

          // TODO: this doesn't seem necessary anymore
          const signature = parseSigningResponse(response, chainId!);

          o.next({ type: "device-signature-granted" });

          const encodedTransaction = await encodeTransaction(rlpEncodedTransaction, signature);

          const operation = buildOptimisticOperation(
            account,
            transaction,
            transaction.fees ?? new BigNumber(0),
          );

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: encodedTransaction.raw,
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );

        return () => {
          cancelled = true;
        };
      }),
  );

const trimLeading0x = (input: string) => (input.startsWith("0x") ? input.slice(2) : input);

const parseSigningResponse = (
  response: {
    s: string;
    v: string;
    r: string;
  },
  chainId: number,
): {
  s: Buffer;
  v: number;
  r: Buffer;
} => {
  // EIP155
  const sigV = parseInt(response.v, 16);
  let eip155V = chainId * 2 + 35;
  if (sigV !== eip155V && (sigV & eip155V) !== sigV) {
    eip155V += 1;
  }

  return {
    s: Buffer.from(response.s, "hex"),
    v: eip155V,
    r: Buffer.from(response.r, "hex"),
  };
};

export default signOperation;
