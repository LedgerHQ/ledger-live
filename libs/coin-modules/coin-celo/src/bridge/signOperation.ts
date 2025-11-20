import { BigNumber } from "bignumber.js";
import { Observable, tap } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account, AccountBridge, DeviceId, SignOperationEvent } from "@ledgerhq/types-live";
import { encodeTransaction, recoverTransaction } from "@celo/wallet-base";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import type { Transaction, CeloAccount } from "../types/types";
import buildTransaction from "./buildTransaction";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { determineFees } from "../network/sdk";
import { CeloTx } from "@celo/connect";
import { rlpEncodedTx } from "@celo/wallet-base";
import { EvmSigner } from "@ledgerhq/coin-evm/types/signer";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import type { ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (signerContext: SignerContext<EvmSigner>): AccountBridge<Transaction>["signOperation"] =>
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
      let cancelled: boolean;

      async function main() {
        const { fees } = transaction;
        if (!fees) throw new FeeNotLoaded();
        const unsignedTransaction = await buildTransaction(account as CeloAccount, transaction);

        const { chainId, to } = unsignedTransaction;

        const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
        const isTokenTransaction = subAccount?.type === "TokenAccount";

        const finalTransaction: CeloTx = {
          ...unsignedTransaction,
          to: isTokenTransaction ? subAccount.token.contractAddress : to!,
          value: isTokenTransaction ? 0 : unsignedTransaction.value!,
        };

        const { address } = await signerContext(deviceId, signer => {
          return signer.getAddress(account.freshAddressPath);
        });
        await determineFees(finalTransaction);

        const rlpEncodedTransaction = rlpEncodedTx(finalTransaction);
        const signature = await signerContext(deviceId, signer => {
          return new Promise<{ s: Buffer; v: number; r: Buffer }>((resolve, reject) => {
            signer
              .signTransaction(
                account.freshAddressPath,
                trimLeading0x(rlpEncodedTransaction.rlpEncode),
              )
              .pipe(
                tap(event => {
                  if (event.type === "signer.evm.signing") {
                    o.next({ type: "device-signature-requested" });
                  }
                  if (event.type === "signer.evm.signed") {
                    const response = event.value;
                    const convertedResponse = { ...response, v: response.v.toString() };
                    const signature = parseSigningResponse(convertedResponse, chainId!);
                    resolve(signature);
                  }
                }),
              )
              .subscribe({
                error: error => {
                  reject(error);
                },
              });
          });
        });

        if (cancelled) return;
        o.next({ type: "device-signature-granted" });
        const encodedTransaction = await encodeTransaction(rlpEncodedTransaction, signature);
        const [_, recoveredAddress] = recoverTransaction(encodedTransaction.raw);
        if (recoveredAddress !== address) {
          throw new Error(
            "celo: there was a signing error, the recovered address doesn't match the your ledger address, the operation was cancelled",
          );
        }
        const operation = buildOptimisticOperation(
          account as CeloAccount,
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
    });

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

  eip155V = sigV;

  return {
    s: Buffer.from(response.s, "hex"),
    v: eip155V,
    r: Buffer.from(response.r, "hex"),
  };
};

export default buildSignOperation;
