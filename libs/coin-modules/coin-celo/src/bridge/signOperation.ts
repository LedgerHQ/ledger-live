import { EvmSignature } from "@ledgerhq/coin-evm/types/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, AccountBridge, DeviceId, SignOperationEvent } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import {
  keccak256,
  recoverAddress,
  type Signature,
} from "viem";
import { serializeTransaction } from "viem/celo";
import type { TransactionSerializableCIP64 } from "viem/celo";
import { getFeeMarketGasParams } from "../network/sdk";
import { CeloSigner } from "../signer";
import type { Transaction, CeloAccount } from "../types/types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import buildTransaction from "./buildTransaction";

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
      let cancelled: boolean;

      async function main() {
        const { fees } = transaction;
        if (!fees) throw new FeeNotLoaded();

        const unsignedTransaction = await buildTransaction(account as CeloAccount, transaction);
        const { chainId, nonce, feeCurrency } = unsignedTransaction;

        const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
        const isTokenTransaction = subAccount?.type === "TokenAccount";

        const to = isTokenTransaction ? subAccount.token.contractAddress : unsignedTransaction.to;
        const value = isTokenTransaction ? "0x0" : (unsignedTransaction.value ?? "0x0");

        const { maxFeePerGas, maxPriorityFeePerGas } = await getFeeMarketGasParams(
          feeCurrency ?? undefined,
        );

        const txToSerialize: TransactionSerializableCIP64 = {
          chainId: chainId!,
          nonce: nonce!,
          to: to as `0x${string}`,
          value: BigInt(value),
          gas: BigInt(unsignedTransaction.gas ?? 0),
          maxFeePerGas,
          maxPriorityFeePerGas,
          data: unsignedTransaction.data,
          type: "cip64",
          ...(feeCurrency ? { feeCurrency } : {}),
        };

        const { address } = await signerContext(deviceId, signer =>
          signer.getAddress(account.freshAddressPath),
        );

        // Serialize unsigned tx — this is the raw hex sent to the Ledger
        const serializedUnsigned = serializeTransaction(txToSerialize);
        const rawTxHex = serializedUnsigned.startsWith("0x")
          ? serializedUnsigned.slice(2)
          : serializedUnsigned;

        o.next({ type: "device-signature-requested" });

        const response = (await signerContext(deviceId, signer =>
          signer.signTransaction(account.freshAddressPath, rawTxHex),
        )) as EvmSignature;

        if (cancelled) return;

        o.next({ type: "device-signature-granted" });

        const v = BigInt("0x" + response.v);
        const signature: Signature = {
          r: ("0x" + response.r) as `0x${string}`,
          s: ("0x" + response.s) as `0x${string}`,
          v,
          yParity: v % BigInt(2) === BigInt(0) ? 0 : 1,
        };

        // Serialize the signed transaction
        const signedRaw = serializeTransaction(txToSerialize, signature);

        // Verify the recovered address matches
        const txHash = keccak256(serializedUnsigned);
        const recoveredAddress = await recoverAddress({ hash: txHash, signature });

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error(
            "celo: there was a signing error, the recovered address doesn't match your ledger address, the operation was cancelled",
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
            signature: signedRaw,
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

export default buildSignOperation;
