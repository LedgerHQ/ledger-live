import { BufferWriter } from "../buffertools";
import { PsbtV2 } from "./psbtv2";

/**
 * This implements the "Transaction Extractor" role of BIP370 (PSBTv2
 * https://github.com/bitcoin/bips/blob/master/bip-0370.mediawiki#transaction-extractor). However
 * the role is partially documented in BIP174 (PSBTv0
 * https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki#transaction-extractor).
 */
export function extract(psbt: PsbtV2): Buffer {
  const tx = new BufferWriter();
  tx.writeUInt32(psbt.getGlobalTxVersion());

  const isSegwit = !!psbt.getInputWitnessUtxo(0);
  if (isSegwit) {
    tx.writeSlice(Buffer.from([0, 1]));
  }
  const inputCount = psbt.getGlobalInputCount();
  tx.writeVarInt(inputCount);
  const witnessWriter = new BufferWriter();
  for (let i = 0; i < inputCount; i++) {
    tx.writeSlice(psbt.getInputPreviousTxid(i));
    tx.writeUInt32(psbt.getInputOutputIndex(i));
    tx.writeVarSlice(psbt.getInputFinalScriptsig(i) ?? Buffer.from([]));
    tx.writeUInt32(psbt.getInputSequence(i));
    if (isSegwit) {
      witnessWriter.writeSlice(psbt.getInputFinalScriptwitness(i));
    }
  }
  const outputCount = psbt.getGlobalOutputCount();
  tx.writeVarInt(outputCount);
  for (let i = 0; i < outputCount; i++) {
    tx.writeUInt64(psbt.getOutputAmount(i));
    tx.writeVarSlice(psbt.getOutputScript(i));
  }
  tx.writeSlice(witnessWriter.buffer());
  tx.writeUInt32(psbt.getGlobalFallbackLocktime() ?? 0);
  return tx.buffer();
}
