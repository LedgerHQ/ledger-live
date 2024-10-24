import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { encodeTransaction, recoverTransaction } from "@celo/wallet-base";

import { buildOptimisticOperation } from "./buildOptimisticOperation";
import type { Transaction, CeloAccount } from "./types";
import { withDevice } from "../../hw/deviceAccess";
import buildTransaction from "./buildTransaction";
import Celo from "./hw-app-celo";

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

          const celo = new Celo(transport);
          const unsignedTransaction = await buildTransaction(account, transaction);
          const { chainId, to } = unsignedTransaction;

          await Promise.all([
            celo.verifyTokenInfo(to!, chainId!),
            celo.determineFees(unsignedTransaction),
          ]);

          const rlpEncodedTransaction = await celo.rlpEncodedTxForLedger(unsignedTransaction);

          o.next({ type: "device-signature-requested" });
          const response = await celo.signTransaction(
            account.freshAddressPath,
            trimLeading0x(rlpEncodedTransaction.rlpEncode),
          );
          // freshAddressPath is actually a derivation path
          const { address } = await celo.getAddress(account.freshAddressPath);

          if (cancelled) return;

          const signature = parseSigningResponse(response, chainId!, await celo.isAppModern());

          o.next({ type: "device-signature-granted" });

          const encodedTransaction = await encodeTransaction(rlpEncodedTransaction, signature);

          const [_, recoveredAddress] = recoverTransaction(encodedTransaction.raw);
          if (recoveredAddress !== address) {
            throw new Error(
              "celo: there was a signing error, the recovered address doesn't match the your ledger address, the operation was cancelled",
            );
          }

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
  isModern: boolean,
): {
  s: Buffer;
  v: number;
  r: Buffer;
} => {
  // EIP155
  const sigV = parseInt(response.v, 16);
  let eip155V = chainId * 2 + 35;

  if (isModern) {
    // eip1559 and other enveloppes txs dont need to modify V
    // just use what the ledger device returns
    eip155V = sigV;
  } else if (sigV !== eip155V && (sigV & eip155V) !== sigV) {
    eip155V += 1;
  }

  return {
    s: Buffer.from(response.s, "hex"),
    v: eip155V,
    r: Buffer.from(response.r, "hex"),
  };
};

export default signOperation;
