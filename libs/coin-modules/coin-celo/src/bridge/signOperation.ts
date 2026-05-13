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
  type TransactionSerializableEIP1559,
} from "viem";
import { serializeTransaction } from "viem/celo";
import type { TransactionSerializableCIP64 } from "viem/celo";
import { getFeeMarketGasParams } from "../network/sdk";
import { CeloSigner } from "../signer";
import type { Transaction, CeloAccount } from "../types/types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import buildTransaction from "./buildTransaction";

type RunSignOperationInput = {
  signerContext: SignerContext<CeloSigner>;
  account: Account;
  transaction: Transaction;
  deviceId: DeviceId;
  observer: { next: (event: SignOperationEvent) => void };
  isCancelled: () => boolean;
};

const runSignOperation = async ({
  signerContext,
  account,
  transaction,
  deviceId,
  observer,
  isCancelled,
}: RunSignOperationInput): Promise<void> => {
  const { fees } = transaction;
  if (!fees) throw new FeeNotLoaded();

  const unsignedTransaction = await buildTransaction(account as CeloAccount, transaction);
  const { chainId, nonce, feeCurrency } = unsignedTransaction;

  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const isTokenTransaction = subAccount?.type === "TokenAccount";

  const to = isTokenTransaction ? subAccount.token.contractAddress : unsignedTransaction.to;
  const value = isTokenTransaction ? "0x0" : unsignedTransaction.value ?? "0x0";

  const { maxFeePerGas, maxPriorityFeePerGas } = await getFeeMarketGasParams(
    feeCurrency ?? undefined,
  );

  const baseFields = {
    chainId: chainId!,
    nonce: nonce!,
    to: to as `0x${string}`,
    value: BigInt(value),
    gas: BigInt(unsignedTransaction.gas ?? 0),
    maxFeePerGas,
    maxPriorityFeePerGas,
    data: unsignedTransaction.data,
  };

  const txToSerialize: TransactionSerializableCIP64 | TransactionSerializableEIP1559 = feeCurrency
    ? { ...baseFields, type: "cip64", feeCurrency }
    : { ...baseFields, type: "eip1559" };

  const { address } = await signerContext(deviceId, signer =>
    signer.getAddress(account.freshAddressPath),
  );

  const serializedUnsigned = serializeTransaction(txToSerialize);
  const rawTxHex = serializedUnsigned.startsWith("0x")
    ? serializedUnsigned.slice(2)
    : serializedUnsigned;

  observer.next({ type: "device-signature-requested" });

  const response = (await signerContext(deviceId, signer =>
    signer.signTransaction(account.freshAddressPath, rawTxHex),
  )) as EvmSignature;

  if (isCancelled()) return;

  observer.next({ type: "device-signature-granted" });

  const v = BigInt("0x" + response.v);
  const yParity =
    v === BigInt(0) || v === BigInt(1)
      ? Number(v)
      : v === BigInt(27) || v === BigInt(28)
        ? Number(v - BigInt(27))
        : null;
  if (yParity === null) {
    throw new Error(`celo: unsupported signature v value returned by device: ${response.v}`);
  }

  const signature: Signature = {
    r: ("0x" + response.r) as `0x${string}`,
    s: ("0x" + response.s) as `0x${string}`,
    v,
    yParity,
  };

  const signedRaw = serializeTransaction(txToSerialize, signature);
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

  observer.next({
    type: "signed",
    signedOperation: {
      operation,
      signature: signedRaw,
    },
  });
};

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
      let cancelled = false;

      runSignOperation({
        signerContext,
        account,
        transaction,
        deviceId,
        observer: o,
        isCancelled: () => cancelled,
      }).then(
        () => o.complete(),
        e => o.error(e),
      );
      return () => {
        cancelled = true;
      };
    });

export default buildSignOperation;
