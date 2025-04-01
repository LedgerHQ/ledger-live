import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account, AccountBridge, DeviceId, SignOperationEvent } from "@ledgerhq/types-live";
import { rlpEncodedTx } from "@celo/wallet-base";

import { buildOptimisticOperation } from "./buildOptimisticOperation";
import type { Transaction, CeloAccount } from "./types";
import buildTransaction from "./buildTransaction";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { EvmSigner, EvmSignature } from "@ledgerhq/coin-evm/types/signer";
import { determineFees } from "./api/sdk";
import { CeloSigner } from "./signer";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (signerContext: SignerContext<CeloSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: Transaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        const { fees } = transaction;
        if (!fees) throw new FeeNotLoaded();
        const unsignedTransaction = await buildTransaction(account as CeloAccount, transaction);
        const { chainId, to } = unsignedTransaction;

        await signerContext(deviceId, signer => {
          return signer.verifyTokenInfo(to!, chainId!);
        });
        await determineFees(unsignedTransaction);

        const rlpEncodedTransaction = await rlpEncodedTx(unsignedTransaction);
        // const sig = (await signerContext(deviceId, signer => {
        //   return signer.rlpEncodedTxForLedger(to!, chainId!);
        // })) as EvmSignature;
        o.next({ type: "device-signature-requested" });

        const signature = (await signerContext(deviceId, signer => {
          return signer.signTransaction(
            account.freshAddressPath,
            trimLeading0x(rlpEncodedTransaction.rlpEncode),
          );
        })) as EvmSignature;

        o.next({ type: "device-signature-granted" });
        debugger;
        const operation = buildOptimisticOperation(
          account as CeloAccount,
          transaction,
          transaction.fees ?? new BigNumber(0),
        );

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signature.toString(),
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

const trimLeading0x = (input: string) => (input.startsWith("0x") ? input.slice(2) : input);

export default buildSignOperation;
