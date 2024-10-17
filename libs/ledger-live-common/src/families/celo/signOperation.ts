/* eslint-disable no-console */
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
          console.info("niconico fresh address path aka derivaiton", account.freshAddressPath);

          const celo = new Celo(transport);
          const unsignedTransaction = await buildTransaction(account, transaction);
          // eslint-disable-next-line no-console
          console.info("niconico tx", unsignedTransaction);
          const { chainId, to } = unsignedTransaction;

          await Promise.all([
            celo.verifyTokenInfo(to!, chainId!),
            celo.determinePrice(unsignedTransaction),
          ]);
          console.info("niconico tx with price", unsignedTransaction);

          const rlpEncodedTransaction = await celo.rlpEncodedTxForLedger(unsignedTransaction);

          o.next({ type: "device-signature-requested" });
          console.info("niconico sign", rlpEncodedTransaction);
          // celo.signTransaction already does the eip155 v chain stuff 
          // TODO should we be using clearSignTransaction like evm fam does?
          const response = await celo.signTransaction(
            account.freshAddressPath,
            trimLeading0x(rlpEncodedTransaction.rlpEncode),
          );
          // freshAddressPath is actually a derivation path
          const { address } = await celo.getAddress(account.freshAddressPath);
          console.info("niconico address", address);
          console.info("niconico response", response);

          if (cancelled) return;

          // TODO this is causing problems (or at least not fixing them)
          const signature = parseSigningResponse(response, chainId!, await celo.isAppModern());

          o.next({ type: "device-signature-granted" });

          const encodedTransaction = await encodeTransaction(rlpEncodedTransaction, signature);

          const [_, recoveredAddress] = recoverTransaction(encodedTransaction.raw);
          console.info("recoveredAddress");
          if (recoveredAddress !== address) {
            console.error("niconio Address does not match", address, recoveredAddress);
          }

          console.info("niconico fees", transaction.fees.toFixed());
          const operation = buildOptimisticOperation(
            account,
            transaction,
            transaction.fees ?? new BigNumber(0),
          );
          console.info("niconico sign op", operation);
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

// this is where it all goes wrong
// we need to to the conversion from string to number / Buffer. the v seems clearly wrong.
// Buffers im less sure of. might need to do 0x prefix before converting
// v keeps on parsing as 8.123437e1341 or some bs. which seems wrong. it should be an INT. not a decimal.
const parseSigningResponse = (
  response: {
    s: string;
    v: string;
    r: string;
  },
  chainId: number,
  isModern: boolean
): {
  s: Buffer;
  v: number;
  r: Buffer;
} => {
  // EIP155
  const sigV = parseInt(response.v, 16);
  let eip155V = chainId * 2 + 35;

  if (isModern) {
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

// copied from hw-eth
export const applyEIP155 = (vAsHex: string, chainId: number): number => {
  const v = parseInt(vAsHex, 16);

  if (v === 0 || v === 1) {
    // if v is 0 or 1, it's already representing parity
    return chainId * 2 + 35 + v;
  } else if (v === 27 || v === 28) {
    const parity = v - 27; // transforming v into 0 or 1 to become the parity
    return chainId * 2 + 35 + parity;
  }
  // When chainId is lower than 109, hw-app-eth *can* return a v with EIP155 already applied
  // e.g. bsc's chainId is 56 -> v then equals to 147/148
  //      optimism's chainId is 10 -> v equals to 55/56
  //      ethereum's chainId is 1 -> v equals to 0/1
  //      goerli's chainId is 5 -> v equals to 0/1
  return v;
};