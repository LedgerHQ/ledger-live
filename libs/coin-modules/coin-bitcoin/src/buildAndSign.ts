// Build & sign for Bitcoin-family UTXO transactions. Extracted from wallet-btc so the
// wallet engine stays a lean read/accounting layer (scan + coin-selection + storage); the
// device signer (BitcoinSigner) and RBF fee logic live in coin-bitcoin.
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/wallet-btc/account";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/types";
import type { Address } from "@ledgerhq/wallet-btc/storage/types";
import type { PickingStrategy } from "@ledgerhq/wallet-btc/pickingstrategies/types";
import * as utils from "@ledgerhq/wallet-btc/utils";
import { getMinReplacementFeeSat, getTxInputOutpoints } from "./rbfFees";
import { BitcoinSigner, SignerTransaction } from "./signer";

export type BuildAccountTxParams = {
  fromAccount: Account;
  dest: string;
  amount: BigNumber;
  feePerByte: number;
  utxoPickingStrategy: PickingStrategy;
  sequence: number;
  opReturnData?: Buffer | undefined;
  changeAddress?: string | undefined;
  originalTxId?: string;
  /** Pending operations (hash + extra.inputs) to detect conflicting txs; when set with originalTxId, min fee is max over all conflicting */
  pendingOperations?: Array<{ hash: string; extra?: { inputs?: string[] } }>;
  relayFeePerByteSatVb?: BigNumber;
};

async function validateAndGetChangeAddress(params: BuildAccountTxParams): Promise<Address> {
  const changeAddress = await params.fromAccount.xpub.getNewAddress(1, 1);
  if (params.changeAddress && params.changeAddress !== changeAddress.address) {
    throw new Error("Invalid change address");
  }
  return changeAddress;
}

async function getConflictingTxIds(
  fromAccount: Account,
  replaceTxId: string,
  pendingOperations?: Array<{ hash: string; extra?: { inputs?: string[] } }>,
): Promise<Set<string>> {
  const inputOutpoints = await getTxInputOutpoints(fromAccount, replaceTxId);
  const conflictingTxIds = new Set<string>([replaceTxId]);
  if (pendingOperations?.length) {
    for (const op of pendingOperations) {
      const opInputs = op.extra?.inputs;
      if (!Array.isArray(opInputs)) continue;
      if (opInputs.some((inp: string) => inputOutpoints.has(inp))) conflictingTxIds.add(op.hash);
    }
  }
  return conflictingTxIds;
}

async function getMaxMinReplacementFeeSat(
  fromAccount: Account,
  txIds: Set<string>,
): Promise<number> {
  let maxMinFee = 0;
  for (const txId of txIds) {
    try {
      const minFee = await getMinReplacementFeeSat(fromAccount, txId);
      const n = minFee.integerValue().toNumber();
      if (n > maxMinFee) maxMinFee = n;
    } catch {
      // Ignore missing conflicting tx fee context and continue with available conflicts.
    }
  }
  return maxMinFee;
}

async function getMinReplacementFeeSatFromOriginalTx(
  fromAccount: Account,
  originalTxId?: string,
  pendingOperations?: Array<{ hash: string; extra?: { inputs?: string[] } }>,
): Promise<number | undefined> {
  if (!originalTxId) return undefined;

  try {
    const conflictingTxIds = await getConflictingTxIds(
      fromAccount,
      originalTxId,
      pendingOperations,
    );
    const maxMinFee = await getMaxMinReplacementFeeSat(fromAccount, conflictingTxIds);
    return maxMinFee > 0 ? maxMinFee : undefined;
  } catch {
    // Continue with best-effort replacement building.
    // xpub.buildTx still enforces absolute fee-increase constraints from the original tx.
    return undefined;
  }
}

export async function buildAccountTx(params: BuildAccountTxParams): Promise<TransactionInfo> {
  const changeAddress = await validateAndGetChangeAddress(params);
  const minReplacementFeeSat = await getMinReplacementFeeSatFromOriginalTx(
    params.fromAccount,
    params.originalTxId,
    params.pendingOperations,
  );

  const txInfo = await params.fromAccount.xpub.buildTx({
    destAddress: params.dest,
    amount: params.amount,
    feePerByte: params.feePerByte,
    changeAddress,
    utxoPickingStrategy: params.utxoPickingStrategy,
    sequence: params.sequence,
    opReturnData: params.opReturnData,
    ...(params.originalTxId === undefined ? {} : { originalTxId: params.originalTxId }),
    ...(minReplacementFeeSat === undefined ? {} : { minReplacementFeeSat }),
    ...(params.relayFeePerByteSatVb === undefined
      ? {}
      : { relayFeePerByteSatVb: params.relayFeePerByteSatVb }),
  });

  return txInfo;
}

export async function signAccountTx(params: {
  btc: BitcoinSigner;
  fromAccount: Account;
  txInfo: TransactionInfo;
  lockTime?: number | undefined;
  sigHashType?: number | undefined;
  segwit?: boolean | undefined;
  additionals?: Array<string> | undefined;
  expiryHeight?: Buffer | undefined;
  hasExtraData?: boolean | undefined;
  onDeviceSignatureRequested?: () => void;
  onDeviceSignatureGranted?: () => void;
  onDeviceStreaming?: (arg0: { progress: number; total: number; index: number }) => void;
}): Promise<string> {
  const {
    btc,
    fromAccount,
    txInfo,
    additionals,
    hasExtraData,
    onDeviceSignatureRequested,
    onDeviceSignatureGranted,
    onDeviceStreaming,
  } = params;
  const blockHeight = fromAccount.xpub.currentBlockHeight;
  let length = txInfo.outputs.reduce((sum, output) => {
    return sum + 8 + output.script.length + 1;
  }, 1);
  // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/api_impl/BitcoinLikeTransactionApi.cpp#L478
  // Decred has a witness and an expiry height
  if (additionals?.includes("decred")) {
    length += 2 * txInfo.outputs.length;
  }
  const buffer = Buffer.allocUnsafe(length);
  let bufferOffset = 0;
  bufferOffset = utils.writeVarInt(buffer, txInfo.outputs.length, bufferOffset);
  txInfo.outputs.forEach(txOut => {
    // refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/59b21162a2c4645c64271ca004c7a3755a3d72fb/ts_src/bufferutils.ts#L26
    buffer.writeUInt32LE(txOut.value.modulo(new BigNumber(0x100000000)).toNumber(), bufferOffset);
    buffer.writeUInt32LE(
      txOut.value.dividedToIntegerBy(new BigNumber(0x100000000)).toNumber(),
      bufferOffset + 4,
    );
    bufferOffset += 8;
    if (additionals?.includes("decred")) {
      bufferOffset = utils.writeVarInt(buffer, 0, bufferOffset);
      bufferOffset = utils.writeVarInt(buffer, 0, bufferOffset);
    }
    bufferOffset = utils.writeVarInt(buffer, txOut.script.length, bufferOffset);
    bufferOffset += txOut.script.copy(buffer, bufferOffset);
  });
  const outputScriptHex = buffer.toString("hex");
  const associatedKeysets = txInfo.associatedDerivations.map(
    ([account, index]) =>
      `${fromAccount.params.path}/${fromAccount.params.index}'/${account}/${index}`,
  );
  type Inputs = [
    SignerTransaction,
    number,
    string | null | undefined,
    number | null | undefined,
    number | null | undefined, // NOTE: blockheight
  ][];
  const inputs: Inputs = txInfo.inputs.map(i => {
    log("hw", `splitTransaction`, {
      transactionHex: i.txHex,
      isSegwitSupported: true,
      hasExtraData,
      additionals,
    });
    return [
      btc.splitTransaction(i.txHex, true, hasExtraData, additionals),
      i.output_index,
      null,
      i.sequence,
      i.block_height,
    ];
  });

  const lastOutputIndex = txInfo.outputs.length - 1;

  log("hw", `createPaymentTransaction`, {
    inputs,
    associatedKeysets,
    outputScriptHex,
    blockHeight,
    ...(params.lockTime && { lockTime: params.lockTime }),
    ...(params.sigHashType && { sigHashType: params.sigHashType }),
    ...(params.segwit && { segwit: params.segwit }),
    ...(params.expiryHeight && { expiryHeight: params.expiryHeight }),
    ...(txInfo.outputs[lastOutputIndex]?.isChange && {
      changePath: `${fromAccount.params.path}/${fromAccount.params.index}'/${txInfo.changeAddress.account}/${txInfo.changeAddress.index}`,
    }),
    additionals: additionals || [],
  });

  const tx = await btc.createPaymentTransaction({
    inputs,
    associatedKeysets,
    outputScriptHex,
    blockHeight,
    ...(params.lockTime && { lockTime: params.lockTime }),
    ...(params.sigHashType && { sigHashType: params.sigHashType }),
    ...(params.segwit && { segwit: params.segwit }),
    ...(params.expiryHeight && { expiryHeight: params.expiryHeight }),
    ...(txInfo.outputs[lastOutputIndex]?.isChange && {
      changePath: `${fromAccount.params.path}/${fromAccount.params.index}'/${txInfo.changeAddress.account}/${txInfo.changeAddress.index}`,
    }),
    additionals: additionals || [],
    onDeviceSignatureRequested,
    onDeviceSignatureGranted,
    onDeviceStreaming,
  });

  return tx;
}
