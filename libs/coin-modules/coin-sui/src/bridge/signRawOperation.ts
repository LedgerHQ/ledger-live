import type { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, Operation, SignOperationEvent } from "@ledgerhq/types-live";
import { bcs } from "@mysten/sui/bcs";
import { SuiGraphQLRequestError } from "@mysten/sui/graphql";
import { Transaction as SuiTransaction } from "@mysten/sui/transactions";
import { fromBase64, normalizeSuiAddress, toBase64, toHex } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import { Observable, type Observer } from "rxjs";
import suiConfig from "../config";
import {
  SuiAddressBalanceAppUpdateRequired,
  SuiRawTransactionInvalid,
  SuiRawTransactionResolutionFailed,
  SuiRawTransactionSenderMismatch,
  SuiSponsoredTransactionBroadcastUnsupported,
} from "../errors";
import { buildRawTransaction } from "../network/sdk";
import type { Resolution, SuiAccount, SuiSigner, Transaction } from "../types";
import { toLongStructTag } from "../utils";
import { drawsFromAddressBalance, isSuiAppUnknownError, signWithDevice } from "./signOperation";

function parseRawTransaction(transaction: string): SuiTransaction {
  try {
    return transaction.trimStart().startsWith("{")
      ? SuiTransaction.from(transaction)
      : SuiTransaction.from(fromBase64(transaction));
  } catch (cause) {
    throw new SuiRawTransactionInvalid(undefined, { cause });
  }
}

/** Sender and sponsor checks, run before any network or device call. */
function prepareSender(tx: SuiTransaction, account: SuiAccount, broadcast: boolean | undefined) {
  const { sender, gasData } = tx.getData();
  if (sender && normalizeSuiAddress(sender) !== normalizeSuiAddress(account.freshAddress)) {
    throw new SuiRawTransactionSenderMismatch();
  }
  tx.setSenderIfNotSet(account.freshAddress);

  const sponsored =
    !!gasData.owner &&
    normalizeSuiAddress(gasData.owner) !== normalizeSuiAddress(account.freshAddress);
  if (sponsored && broadcast) {
    throw new SuiSponsoredTransactionBroadcastUnsupported();
  }
}

/**
 * Clear signing can load one token descriptor per signature, so a transaction moving exactly one
 * non-SUI coin type that the crypto-assets list knows gets a resolution; otherwise none, and the
 * device decides.
 */
async function resolveToken(
  account: SuiAccount,
  coinTypes: string[],
  deviceModelId: DeviceModelId | undefined,
): Promise<Resolution | undefined> {
  if (coinTypes.length !== 1) return undefined;
  const [coinType] = coinTypes;
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
    toLongStructTag(coinType),
    account.currency.id,
  );
  if (!token) return undefined;
  return {
    deviceModelId,
    certificateSignatureKind: undefined,
    tokenId: token.id,
    tokenAddress: coinType,
  };
}

/**
 * The node could not be reached or answered with an error (offline, timeout, HTTP or gRPC
 * failure), as opposed to the transaction itself failing to resolve.
 */
function isTransportError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    error instanceof SuiGraphQLRequestError ||
    (error instanceof Error && (error.name === "AbortError" || error.name === "RpcError"))
  );
}

/** The dApp knows the intent of a raw transaction and Ledger Live does not, so the operation is a placeholder. */
function placeholderOperation(account: SuiAccount): Operation {
  const hash = "";
  return {
    id: encodeOperationId(account.id, hash, "OUT"),
    hash,
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    extra: {},
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [],
    accountId: account.id,
    date: new Date(),
  };
}

/** Hex of the BCS `SenderSignedData` holding the transaction and its single signature. */
function serializeSignedTransaction(unsigned: Uint8Array, serializedSignature: string): string {
  return toHex(
    bcs.SenderSignedData.serialize([
      {
        intentMessage: {
          intent: {
            scope: { TransactionData: true },
            version: { V0: true },
            appId: { Sui: true },
          },
          value: bcs.TransactionData.parse(unsigned),
        },
        txSignatures: [fromBase64(serializedSignature)],
      },
    ]).toBytes(),
  );
}

async function performSignRawOperation(
  signerContext: SignerContext<SuiSigner>,
  {
    account,
    deviceId,
    transaction,
    broadcast,
    deviceModelId,
  }: Parameters<AccountBridge<Transaction, SuiAccount>["signRawOperation"]>[0],
  observer: Observer<SignOperationEvent>,
  isCancelled: () => boolean,
): Promise<void> {
  const tx = parseRawTransaction(transaction);
  prepareSender(tx, account, broadcast);

  const built = await buildRawTransaction(suiConfig.getCoinConfig(account.currency.id), tx).catch(
    cause => {
      throw isTransportError(cause)
        ? cause
        : new SuiRawTransactionResolutionFailed(undefined, { cause });
    },
  );
  const unsigned = built.serialized;
  const resolution = await resolveToken(account, built.coinTypes, deviceModelId);

  // Building and token lookup are async: a flow closed meanwhile must not prompt the device.
  if (isCancelled()) return;

  observer.next({ type: "device-signature-requested" });

  const signed = await signerContext(deviceId, suiSigner =>
    signWithDevice(account, suiSigner, {
      unsigned,
      objects: built.bcsObjects,
      ...(resolution ? { resolution } : {}),
    }),
  ).catch(error => {
    if (isSuiAppUnknownError(error) && drawsFromAddressBalance(unsigned)) {
      throw new SuiAddressBalanceAppUpdateRequired();
    }
    throw error;
  });

  if (isCancelled()) return;

  observer.next({ type: "device-signature-granted" });

  observer.next({
    type: "signed",
    signedOperation: {
      operation: placeholderOperation(account),
      signature: serializeSignedTransaction(unsigned, signed.signature),
      rawData: { unsigned: toBase64(unsigned), serializedSignature: signed.signature },
    },
  });
}

/**
 * Signs a transaction built by a dApp (Wallet API `transaction.signRaw`).
 *
 * `transaction` is either a serialized `Transaction` JSON (`Transaction.toJSON()`) or the base64 of
 * BCS `TransactionData`. Commands are never changed; only gas price, budget, payment and object
 * versions the dApp left unset are resolved. The sender must be the account, or unset.
 *
 * The signed result is, in `signature`, the hex of the BCS `SenderSignedData` (transaction data plus
 * one signature). A consumer such as a WalletConnect handler decodes it with
 * `bcs.SenderSignedData` to get the transaction bytes and the serialized signature. `rawData` keeps
 * the base64 transaction bytes and the bare serialized signature so `broadcast` can execute it.
 *
 * A sponsored transaction (gas owner other than the sender) can be signed but not broadcast, since
 * the sponsor's signature is missing.
 */
export const buildSignRawOperation =
  (
    signerContext: SignerContext<SuiSigner>,
  ): AccountBridge<Transaction, SuiAccount>["signRawOperation"] =>
  params =>
    new Observable(observer => {
      let cancelled = false;
      performSignRawOperation(signerContext, params, observer, () => cancelled).then(
        () => observer.complete(),
        e => observer.error(e),
      );
      return () => {
        cancelled = true;
      };
    });

export default buildSignRawOperation;
