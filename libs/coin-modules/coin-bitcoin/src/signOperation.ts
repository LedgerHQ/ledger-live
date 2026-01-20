import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { isSegwitDerivationMode } from "@ledgerhq/coin-framework/derivation";
import type { Account, AccountBridge, Operation } from "@ledgerhq/types-live";
import type { Observer } from "rxjs";
import type { Transaction } from "./types";
import { getNetworkParameters } from "./networks";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { calculateFees } from "./cache";
import wallet, { getWalletAccount } from "./wallet-btc";
import { perCoinLogic } from "./logic";
import { SignerContext } from "./signer";
import { fromAsyncOperation } from "./observable";

type SignOperationObserverEvent =
  | { type: "device-signature-granted" }
  | { type: "device-signature-requested" }
  | { type: "device-streaming"; progress: number; index: number; total: number }
  | { type: "signed"; signedOperation: { operation: Operation; signature: string } };

function buildAdditionals(
  currencyId: string,
  derivationMode: string,
  transaction: Transaction,
): string[] {
  const perCoin = perCoinLogic[currencyId];
  let additionals: string[] = [currencyId];

  if (derivationMode === "native_segwit") {
    additionals.push("bech32");
  }

  if (derivationMode === "taproot") {
    additionals.push("bech32m");
  }

  if (perCoin?.getAdditionals) {
    additionals = additionals.concat(
      perCoin.getAdditionals({
        transaction,
      }),
    );
  }

  return additionals;
}

async function executeSignOperation(
  o: Observer<SignOperationObserverEvent>,
  account: Account,
  deviceId: string,
  transaction: Transaction,
  signerContext: SignerContext,
): Promise<void> {
  const { currency } = account;
  const walletAccount = getWalletAccount(account);

  log("hw", `signTransaction ${currency.id} for account ${account.id}`);
  const txInfo = await buildTransaction(account, transaction);

  // Maybe better not re-calculate these fields here, instead include them
  // in Transaction type and set them in prepareTransaction?
  const res = await calculateFees({
    account,
    transaction,
  });

  const senders = res.txInputs.reduce((acc, i) => {
    if (i.address) acc.add(i.address);
    return acc;
  }, new Set<string>());

  const recipients = res.txOutputs.reduce<string[]>((acc, o) => {
    if (!o.isChange && o.address) acc.push(o.address);
    return acc;
  }, []);

  const fee = res.fees;

  let lockTime: number | undefined;

  // (legacy) Set lockTime for Komodo to enable reward claiming on UTXOs created by
  // Ledger Live. We should only set this if the currency is Komodo and
  // lockTime isn't already defined.
  if (currency.id === "komodo" && lockTime === undefined) {
    const unixtime = Math.floor(Date.now() / 1000);
    lockTime = unixtime - 777;
  }

  const networkParams = getNetworkParameters(currency.id);
  const sigHashType = networkParams.sigHash;
  if (isNaN(sigHashType)) {
    throw new Error("sigHashType should not be NaN");
  }

  const segwit = isSegwitDerivationMode(account.derivationMode);
  const additionals = buildAdditionals(currency.id, account.derivationMode, transaction);

  const perCoin = perCoinLogic[currency.id];
  const expiryHeight = perCoin?.hasExpiryHeight ? Buffer.from([0x00, 0x00, 0x00, 0x00]) : undefined;

  const hasExtraData = perCoin?.hasExtraData || false;

  const signature: string = await signerContext(deviceId, currency, signer =>
    wallet.signAccountTx({
      btc: signer,
      fromAccount: walletAccount,
      txInfo,
      lockTime,
      sigHashType,
      segwit,
      additionals,
      expiryHeight,
      hasExtraData,
      onDeviceSignatureGranted: () =>
        o.next({
          type: "device-signature-granted",
        }),
      onDeviceSignatureRequested: () =>
        o.next({
          type: "device-signature-requested",
        }),
      onDeviceStreaming: ({ progress, index, total }) =>
        o.next({
          type: "device-streaming",
          progress,
          index,
          total,
        }),
    }),
  );

  const operation = buildOptimisticOperation({
    accountId: account.id,
    fee,
    value: new BigNumber(transaction.amount).plus(fee),
    senders: Array.from(senders),
    recipients,
  });

  // Verify that UTXOs used as inputs are still valid (parent tx still fetchable)
  const inputValidationResults = await Promise.allSettled(
    txInfo.inputs.map(input => walletAccount.xpub.explorer.getTxHex(input.output_hash)),
  );
  if (inputValidationResults.some(r => r.status === "rejected")) {
    throw new Error(
      "One or more inputs are no longer valid (transaction may have been spent or reorged). Please rebuild the transaction.",
    );
  }

  o.next({
    type: "signed",
    signedOperation: {
      operation,
      signature,
    },
  });
}

export const buildSignOperation =
  (signerContext: SignerContext): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    fromAsyncOperation(o => executeSignOperation(o, account, deviceId, transaction, signerContext));

export default buildSignOperation;
