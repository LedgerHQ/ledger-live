import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { splitTransaction } from "@ledgerhq/hw-app-btc/splitTransaction";
import * as utils from "@ledgerhq/wallet-btc/utils";
import type { Account as WalletAccount, TransactionInfo } from "@ledgerhq/wallet-btc/index";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge, Operation, SignOperationEvent } from "@ledgerhq/types-live";
import type { BitcoinCreateTransactionLike } from "@ledgerhq/live-signer-zcash";
import type { ZcashContext } from "../config";
import type { BtcInputRef, Transaction, ZcashAccount } from "../types/bridge";
import type { SignerContext } from "../types/signer";
import { marginalFeeFor } from "../logic/coin-selection";
import {
  buildLegacyTransaction,
  buildPreparedLegacyTransaction,
  resolveWalletAccount,
} from "./buildTransaction";
import { zcashNetworkOf, type ZcashNetwork } from "../logic/network";

// The signer recognises Zcash by the "zcash" marker alone (both networks), and "sapling"
// selects the post-Sapling transaction layout.
const ZCASH_ADDITIONALS = ["zcash", "sapling"];
const SIGHASH_ALL = 1;
// 0 = the transaction never expires.
const NO_EXPIRY_HEIGHT = Buffer.alloc(4);

/** The serialized outputs the device is asked to validate. */
function serializeOutputs(txInfo: TransactionInfo): string {
  const length = txInfo.outputs.reduce((sum, output) => sum + 8 + output.script.length + 1, 1);
  const buffer = Buffer.allocUnsafe(length);
  let offset = utils.writeVarInt(buffer, txInfo.outputs.length, 0);
  for (const { value, script } of txInfo.outputs) {
    // refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/59b21162a2c4645c64271ca004c7a3755a3d72fb/ts_src/bufferutils.ts#L26
    buffer.writeUInt32LE(value.modulo(new BigNumber(0x100000000)).toNumber(), offset);
    buffer.writeUInt32LE(
      value.dividedToIntegerBy(new BigNumber(0x100000000)).toNumber(),
      offset + 4,
    );
    offset += 8;
    offset = utils.writeVarInt(buffer, script.length, offset);
    offset += script.copy(buffer, offset);
  }
  return buffer.toString("hex");
}

/**
 * The device is handed each previous transaction parsed, and needs its raw bytes
 * too: a V5 source carries a shielded bundle that re-serialization strips, and
 * hashing the stripped form yields a transaction id the chain has never seen.
 */
function toDeviceInputs(txInfo: TransactionInfo): BitcoinCreateTransactionLike["inputs"] {
  return txInfo.inputs.map(input => [
    { ...splitTransaction(input.txHex, true, true, ZCASH_ADDITIONALS), rawTxHex: input.txHex },
    input.output_index,
    null,
    input.sequence,
    input.block_height,
  ]);
}

function toPaymentArg(
  walletAccount: WalletAccount,
  txInfo: TransactionInfo,
  network: ZcashNetwork,
  callbacks: Pick<
    BitcoinCreateTransactionLike,
    "onDeviceSignatureRequested" | "onDeviceSignatureGranted"
  >,
): BitcoinCreateTransactionLike {
  const { path, index } = walletAccount.params;
  const lastOutput = txInfo.outputs[txInfo.outputs.length - 1];
  const { currentBlockHeight } = walletAccount.xpub;
  return {
    inputs: toDeviceInputs(txInfo),
    associatedKeysets: txInfo.associatedDerivations.map(
      ([account, addressIndex]) => `${path}/${index}'/${account}/${addressIndex}`,
    ),
    outputScriptHex: serializeOutputs(txInfo),
    ...(currentBlockHeight !== undefined && { blockHeight: currentBlockHeight }),
    sigHashType: SIGHASH_ALL,
    expiryHeight: NO_EXPIRY_HEIGHT,
    ...(lastOutput?.isChange && {
      changePath: `${path}/${index}'/${txInfo.changeAddress.account}/${txInfo.changeAddress.index}`,
    }),
    additionals: ZCASH_ADDITIONALS,
    network,
    ...callbacks,
  };
}

type BuildStep = (
  walletAccount: WalletAccount,
  account: ZcashAccount,
  transaction: Transaction,
) => Promise<TransactionInfo>;

const makeLegacySignOperation =
  (
    signerContext: SignerContext,
    context: ZcashContext,
    build: BuildStep,
  ): AccountBridge<Transaction, ZcashAccount>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable<SignOperationEvent>(subscriber => {
      (async () => {
        const walletAccount = await resolveWalletAccount(context, account);
        const txInfo = await build(walletAccount, account, transaction);
        // The caller unsubscribes when the user dismisses the send; the device must
        // not then be asked to sign it.
        if (subscriber.closed) return;

        const signature = await signerContext(deviceId, signer =>
          signer.createPaymentTransaction(
            toPaymentArg(walletAccount, txInfo, zcashNetworkOf(account.currency.id), {
              onDeviceSignatureRequested: () =>
                subscriber.next({ type: "device-signature-requested" }),
              onDeviceSignatureGranted: () => subscriber.next({ type: "device-signature-granted" }),
            }),
          ),
        );

        const fee = new BigNumber(txInfo.fee);
        const inputRefs: BtcInputRef[] = txInfo.inputs.flatMap(input =>
          input.output_hash !== undefined && input.address !== undefined
            ? [{ hash: input.output_hash, outputIndex: input.output_index, address: input.address }]
            : [],
        );
        const operation: Operation = {
          id: encodeOperationId(account.id, "", "OUT"),
          hash: "",
          type: "OUT",
          value: transaction.amount.plus(fee),
          fee,
          blockHash: null,
          blockHeight: null,
          senders: [...new Set(inputRefs.map(ref => ref.address))],
          recipients: txInfo.outputs.flatMap(output =>
            !output.isChange && output.address ? [output.address] : [],
          ),
          accountId: account.id,
          date: new Date(),
          extra: {
            inputs: inputRefs.map(ref => `${ref.hash}-${ref.outputIndex}`),
            inputRefs,
          },
        };

        subscriber.next({ type: "signed", signedOperation: { operation, signature } });
        subscriber.complete();
      })().catch(error => subscriber.error(error));
    });

/**
 * Builds the transparent transaction with wallet-btc and has the device sign it
 * (`createPaymentTransaction`), the way coin-bitcoin did for Zcash. No PCZT, no
 * engine.
 */
export const buildLegacySignOperation = (
  signerContext: SignerContext,
  context: ZcashContext,
): AccountBridge<Transaction, ZcashAccount>["signOperation"] =>
  makeLegacySignOperation(signerContext, context, async (walletAccount, account, transaction) => {
    const { zip2009 } = await context.config(account.currency.id);
    const { txInfo } = await buildLegacyTransaction(
      context.logger,
      walletAccount,
      transaction,
      marginalFeeFor(account, zip2009),
    );
    return txInfo;
  });

/**
 * The same legacy signature, built from the selection the prepare step priced
 * (inputs, fee, change) so the device signs what the user reviewed. For devices
 * whose Zcash app only speaks the legacy protocol while the host runs the
 * shielded engine.
 */
export const buildPreparedLegacySignOperation = (
  signerContext: SignerContext,
  context: ZcashContext,
): AccountBridge<Transaction, ZcashAccount>["signOperation"] =>
  makeLegacySignOperation(signerContext, context, async (walletAccount, account, transaction) => {
    const { zip2009 } = await context.config(account.currency.id);
    return buildPreparedLegacyTransaction(
      context.logger,
      walletAccount,
      account,
      transaction,
      marginalFeeFor(account, zip2009),
    );
  });
