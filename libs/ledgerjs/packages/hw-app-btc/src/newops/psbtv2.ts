/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  BufferReader,
  BufferWriter,
  unsafeFrom64bitLE,
  unsafeTo64bitLE,
} from "../buffertools";

export enum psbtGlobal {
  TX_VERSION = 0x02,
  FALLBACK_LOCKTIME = 0x03,
  INPUT_COUNT = 0x04,
  OUTPUT_COUNT = 0x05,
  TX_MODIFIABLE = 0x06,
  VERSION = 0xfb,
}
export enum psbtIn {
  NON_WITNESS_UTXO = 0x00,
  WITNESS_UTXO = 0x01,
  PARTIAL_SIG = 0x02,
  SIGHASH_TYPE = 0x03,
  REDEEM_SCRIPT = 0x04,
  BIP32_DERIVATION = 0x06,
  FINAL_SCRIPTSIG = 0x07,
  FINAL_SCRIPTWITNESS = 0x08,
  PREVIOUS_TXID = 0x0e,
  OUTPUT_INDEX = 0x0f,
  SEQUENCE = 0x10,
  TAP_KEY_SIG = 0x13,
  TAP_BIP32_DERIVATION = 0x16,
}
export enum psbtOut {
  REDEEM_SCRIPT = 0x00,
  BIP_32_DERIVATION = 0x02,
  AMOUNT = 0x03,
  SCRIPT = 0x04,
  TAP_BIP32_DERIVATION = 0x07,
}

const PSBT_MAGIC_BYTES = Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff]);

export class NoSuchEntry extends Error {}

/**
 * Implements Partially Signed Bitcoin Transaction version 2, BIP370, as
 * documented at https://github.com/bitcoin/bips/blob/master/bip-0370.mediawiki
 * and https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki
 *
 * A psbt is a data structure that can carry all relevant information about a
 * transaction through all stages of the signing process. From constructing an
 * unsigned transaction to extracting the final serialized transaction ready for
 * broadcast.
 *
 * This implementation is limited to what's needed in ledgerjs to carry out its
 * duties, which means that support for features like multisig or taproot script
 * path spending are not implemented. Specifically, it supports p2pkh,
 * p2wpkhWrappedInP2sh, p2wpkh and p2tr key path spending.
 *
 * This class is made purposefully dumb, so it's easy to add support for
 * complemantary fields as needed in the future.
 */
export class PsbtV2 {
  protected globalMap: Map<string, Buffer> = new Map();
  protected inputMaps: Map<string, Buffer>[] = [];
  protected outputMaps: Map<string, Buffer>[] = [];

  setGlobalTxVersion(version: number) {
    this.setGlobal(psbtGlobal.TX_VERSION, uint32LE(version));
  }
  getGlobalTxVersion(): number {
    return this.getGlobal(psbtGlobal.TX_VERSION).readUInt32LE(0);
  }
  setGlobalFallbackLocktime(locktime: number) {
    this.setGlobal(psbtGlobal.FALLBACK_LOCKTIME, uint32LE(locktime));
  }
  getGlobalFallbackLocktime(): number | undefined {
    return this.getGlobalOptional(psbtGlobal.FALLBACK_LOCKTIME)?.readUInt32LE(
      0
    );
  }
  setGlobalInputCount(inputCount: number) {
    this.setGlobal(psbtGlobal.INPUT_COUNT, varint(inputCount));
  }
  getGlobalInputCount(): number {
    return fromVarint(this.getGlobal(psbtGlobal.INPUT_COUNT));
  }
  setGlobalOutputCount(outputCount: number) {
    this.setGlobal(psbtGlobal.OUTPUT_COUNT, varint(outputCount));
  }
  getGlobalOutputCount(): number {
    return fromVarint(this.getGlobal(psbtGlobal.OUTPUT_COUNT));
  }
  setGlobalTxModifiable(byte: Buffer) {
    this.setGlobal(psbtGlobal.TX_MODIFIABLE, byte);
  }
  getGlobalTxModifiable(): Buffer | undefined {
    return this.getGlobalOptional(psbtGlobal.TX_MODIFIABLE);
  }
  setGlobalPsbtVersion(psbtVersion: number) {
    this.setGlobal(psbtGlobal.VERSION, uint32LE(psbtVersion));
  }
  getGlobalPsbtVersion(): number {
    return this.getGlobal(psbtGlobal.VERSION).readUInt32LE(0);
  }

  setInputNonWitnessUtxo(inputIndex: number, transaction: Buffer) {
    this.setInput(inputIndex, psbtIn.NON_WITNESS_UTXO, b(), transaction);
  }
  getInputNonWitnessUtxo(inputIndex: number): Buffer | undefined {
    return this.getInputOptional(inputIndex, psbtIn.NON_WITNESS_UTXO, b());
  }
  setInputWitnessUtxo(
    inputIndex: number,
    amount: Buffer,
    scriptPubKey: Buffer
  ) {
    const buf = new BufferWriter();
    buf.writeSlice(amount);
    buf.writeVarSlice(scriptPubKey);
    this.setInput(inputIndex, psbtIn.WITNESS_UTXO, b(), buf.buffer());
  }
  getInputWitnessUtxo(
    inputIndex: number
  ): { amount: Buffer; scriptPubKey: Buffer } | undefined {
    const utxo = this.getInputOptional(inputIndex, psbtIn.WITNESS_UTXO, b());
    if (!utxo) return undefined;
    const buf = new BufferReader(utxo);
    return { amount: buf.readSlice(8), scriptPubKey: buf.readVarSlice() };
  }
  setInputPartialSig(inputIndex: number, pubkey: Buffer, signature: Buffer) {
    this.setInput(inputIndex, psbtIn.PARTIAL_SIG, pubkey, signature);
  }
  getInputPartialSig(inputIndex: number, pubkey: Buffer): Buffer | undefined {
    return this.getInputOptional(inputIndex, psbtIn.PARTIAL_SIG, pubkey);
  }
  setInputSighashType(inputIndex: number, sigHashtype: number) {
    this.setInput(inputIndex, psbtIn.SIGHASH_TYPE, b(), uint32LE(sigHashtype));
  }
  getInputSighashType(inputIndex: number): number | undefined {
    const result = this.getInputOptional(inputIndex, psbtIn.SIGHASH_TYPE, b());
    if (!result) return undefined;
    return result.readUInt32LE(0);
  }
  setInputRedeemScript(inputIndex: number, redeemScript: Buffer) {
    this.setInput(inputIndex, psbtIn.REDEEM_SCRIPT, b(), redeemScript);
  }
  getInputRedeemScript(inputIndex: number): Buffer | undefined {
    return this.getInputOptional(inputIndex, psbtIn.REDEEM_SCRIPT, b());
  }
  setInputBip32Derivation(
    inputIndex: number,
    pubkey: Buffer,
    masterFingerprint: Buffer,
    path: number[]
  ) {
    if (pubkey.length != 33)
      throw new Error("Invalid pubkey length: " + pubkey.length);
    this.setInput(
      inputIndex,
      psbtIn.BIP32_DERIVATION,
      pubkey,
      this.encodeBip32Derivation(masterFingerprint, path)
    );
  }
  getInputBip32Derivation(
    inputIndex: number,
    pubkey: Buffer
  ): { masterFingerprint: Buffer; path: number[] } | undefined {
    const buf = this.getInputOptional(
      inputIndex,
      psbtIn.BIP32_DERIVATION,
      pubkey
    );
    if (!buf) return undefined;
    return this.decodeBip32Derivation(buf);
  }
  setInputFinalScriptsig(inputIndex: number, scriptSig: Buffer) {
    this.setInput(inputIndex, psbtIn.FINAL_SCRIPTSIG, b(), scriptSig);
  }
  getInputFinalScriptsig(inputIndex: number): Buffer | undefined {
    return this.getInputOptional(inputIndex, psbtIn.FINAL_SCRIPTSIG, b());
  }
  setInputFinalScriptwitness(inputIndex: number, scriptWitness: Buffer) {
    this.setInput(inputIndex, psbtIn.FINAL_SCRIPTWITNESS, b(), scriptWitness);
  }
  getInputFinalScriptwitness(inputIndex: number): Buffer {
    return this.getInput(inputIndex, psbtIn.FINAL_SCRIPTWITNESS, b());
  }
  setInputPreviousTxId(inputIndex: number, txid: Buffer) {
    this.setInput(inputIndex, psbtIn.PREVIOUS_TXID, b(), txid);
  }
  getInputPreviousTxid(inputIndex: number): Buffer {
    return this.getInput(inputIndex, psbtIn.PREVIOUS_TXID, b());
  }
  setInputOutputIndex(inputIndex: number, outputIndex: number) {
    this.setInput(inputIndex, psbtIn.OUTPUT_INDEX, b(), uint32LE(outputIndex));
  }
  getInputOutputIndex(inputIndex: number): number {
    return this.getInput(inputIndex, psbtIn.OUTPUT_INDEX, b()).readUInt32LE(0);
  }
  setInputSequence(inputIndex: number, sequence: number) {
    this.setInput(inputIndex, psbtIn.SEQUENCE, b(), uint32LE(sequence));
  }
  getInputSequence(inputIndex: number): number {
    return (
      this.getInputOptional(inputIndex, psbtIn.SEQUENCE, b())?.readUInt32LE(
        0
      ) ?? 0xffffffff
    );
  }
  setInputTapKeySig(inputIndex: number, sig: Buffer) {
    this.setInput(inputIndex, psbtIn.TAP_KEY_SIG, b(), sig);
  }
  getInputTapKeySig(inputIndex: number): Buffer | undefined {
    return this.getInputOptional(inputIndex, psbtIn.TAP_KEY_SIG, b());
  }
  setInputTapBip32Derivation(
    inputIndex: number,
    pubkey: Buffer,
    hashes: Buffer[],
    masterFingerprint: Buffer,
    path: number[]
  ) {
    if (pubkey.length != 32)
      throw new Error("Invalid pubkey length: " + pubkey.length);
    const buf = this.encodeTapBip32Derivation(hashes, masterFingerprint, path);
    this.setInput(inputIndex, psbtIn.TAP_BIP32_DERIVATION, pubkey, buf);
  }
  getInputTapBip32Derivation(
    inputIndex: number,
    pubkey: Buffer
  ): { hashes: Buffer[]; masterFingerprint: Buffer; path: number[] } {
    const buf = this.getInput(inputIndex, psbtIn.TAP_BIP32_DERIVATION, pubkey);
    return this.decodeTapBip32Derivation(buf);
  }
  getInputKeyDatas(inputIndex: number, keyType: KeyType): Buffer[] {
    return this.getKeyDatas(this.inputMaps[inputIndex], keyType);
  }

  setOutputRedeemScript(outputIndex: number, redeemScript: Buffer) {
    this.setOutput(outputIndex, psbtOut.REDEEM_SCRIPT, b(), redeemScript);
  }
  getOutputRedeemScript(outputIndex: number): Buffer {
    return this.getOutput(outputIndex, psbtOut.REDEEM_SCRIPT, b());
  }
  setOutputBip32Derivation(
    outputIndex: number,
    pubkey: Buffer,
    masterFingerprint: Buffer,
    path: number[]
  ) {
    this.setOutput(
      outputIndex,
      psbtOut.BIP_32_DERIVATION,
      pubkey,
      this.encodeBip32Derivation(masterFingerprint, path)
    );
  }
  getOutputBip32Derivation(
    outputIndex: number,
    pubkey: Buffer
  ): { masterFingerprint: Buffer; path: number[] } {
    const buf = this.getOutput(outputIndex, psbtOut.BIP_32_DERIVATION, pubkey);
    return this.decodeBip32Derivation(buf);
  }
  setOutputAmount(outputIndex: number, amount: number) {
    this.setOutput(outputIndex, psbtOut.AMOUNT, b(), uint64LE(amount));
  }
  getOutputAmount(outputIndex: number): number {
    const buf = this.getOutput(outputIndex, psbtOut.AMOUNT, b());
    return unsafeFrom64bitLE(buf);
  }
  setOutputScript(outputIndex: number, scriptPubKey: Buffer) {
    this.setOutput(outputIndex, psbtOut.SCRIPT, b(), scriptPubKey);
  }
  getOutputScript(outputIndex: number): Buffer {
    return this.getOutput(outputIndex, psbtOut.SCRIPT, b());
  }
  setOutputTapBip32Derivation(
    outputIndex: number,
    pubkey: Buffer,
    hashes: Buffer[],
    fingerprint: Buffer,
    path: number[]
  ) {
    const buf = this.encodeTapBip32Derivation(hashes, fingerprint, path);
    this.setOutput(outputIndex, psbtOut.TAP_BIP32_DERIVATION, pubkey, buf);
  }
  getOutputTapBip32Derivation(
    outputIndex: number,
    pubkey: Buffer
  ): { hashes: Buffer[]; masterFingerprint: Buffer; path: number[] } {
    const buf = this.getOutput(
      outputIndex,
      psbtOut.TAP_BIP32_DERIVATION,
      pubkey
    );
    return this.decodeTapBip32Derivation(buf);
  }

  deleteInputEntries(inputIndex: number, keyTypes: psbtIn[]) {
    const map = this.inputMaps[inputIndex];
    map.forEach((_v, k, m) => {
      if (this.isKeyType(k, keyTypes)) {
        m.delete(k);
      }
    });
  }

  copy(to: PsbtV2) {
    this.copyMap(this.globalMap, to.globalMap);
    this.copyMaps(this.inputMaps, to.inputMaps);
    this.copyMaps(this.outputMaps, to.outputMaps);
  }
  copyMaps(from: Map<string, Buffer>[], to: Map<string, Buffer>[]) {
    from.forEach((m, index) => {
      const to_index = new Map();
      this.copyMap(m, to_index);
      to[index] = to_index;
    });
  }
  copyMap(from: Map<string, Buffer>, to: Map<string, Buffer>) {
    from.forEach((v, k) => to.set(k, Buffer.from(v)));
  }
  serialize(): Buffer {
    const buf = new BufferWriter();
    buf.writeSlice(Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff]));
    serializeMap(buf, this.globalMap);
    this.inputMaps.forEach((map) => {
      serializeMap(buf, map);
    });
    this.outputMaps.forEach((map) => {
      serializeMap(buf, map);
    });
    return buf.buffer();
  }
  deserialize(psbt: Buffer) {
    const buf = new BufferReader(psbt);
    if (!buf.readSlice(5).equals(PSBT_MAGIC_BYTES)) {
      throw new Error("Invalid magic bytes");
    }
    while (this.readKeyPair(this.globalMap, buf));
    for (let i = 0; i < this.getGlobalInputCount(); i++) {
      this.inputMaps[i] = new Map();
      while (this.readKeyPair(this.inputMaps[i], buf));
    }
    for (let i = 0; i < this.getGlobalOutputCount(); i++) {
      this.outputMaps[i] = new Map();
      while (this.readKeyPair(this.outputMaps[i], buf));
    }
  }
  private readKeyPair(map: Map<string, Buffer>, buf: BufferReader): boolean {
    const keyLen = buf.readVarInt();
    if (keyLen == 0) {
      return false;
    }
    const keyType = buf.readUInt8();
    const keyData = buf.readSlice(keyLen - 1);
    const value = buf.readVarSlice();
    set(map, keyType, keyData, value);
    return true;
  }
  private getKeyDatas(map: Map<string, Buffer>, keyType: KeyType): Buffer[] {
    const result: Buffer[] = [];
    map.forEach((_v, k) => {
      if (this.isKeyType(k, [keyType])) {
        result.push(Buffer.from(k.substring(2), "hex"));
      }
    });
    return result;
  }
  private isKeyType(hexKey: string, keyTypes: KeyType[]): boolean {
    const keyType = Buffer.from(hexKey.substring(0, 2), "hex").readUInt8(0);
    return keyTypes.some((k) => k == keyType);
  }
  private setGlobal(keyType: KeyType, value: Buffer) {
    const key = new Key(keyType, Buffer.from([]));
    this.globalMap.set(key.toString(), value);
  }
  private getGlobal(keyType: KeyType): Buffer {
    return get(this.globalMap, keyType, b(), false)!;
  }
  private getGlobalOptional(keyType: KeyType): Buffer | undefined {
    return get(this.globalMap, keyType, b(), true);
  }
  private setInput(
    index: number,
    keyType: KeyType,
    keyData: Buffer,
    value: Buffer
  ) {
    set(this.getMap(index, this.inputMaps), keyType, keyData, value);
  }
  private getInput(index: number, keyType: KeyType, keyData: Buffer): Buffer {
    return get(this.inputMaps[index], keyType, keyData, false)!;
  }
  private getInputOptional(
    index: number,
    keyType: KeyType,
    keyData: Buffer
  ): Buffer | undefined {
    return get(this.inputMaps[index], keyType, keyData, true);
  }
  private setOutput(
    index: number,
    keyType: KeyType,
    keyData: Buffer,
    value: Buffer
  ) {
    set(this.getMap(index, this.outputMaps), keyType, keyData, value);
  }
  private getOutput(index: number, keyType: KeyType, keyData: Buffer): Buffer {
    return get(this.outputMaps[index], keyType, keyData, false)!;
  }
  private getMap(
    index: number,
    maps: Map<string, Buffer>[]
  ): Map<string, Buffer> {
    if (maps[index]) {
      return maps[index];
    }
    return (maps[index] = new Map());
  }
  private encodeBip32Derivation(masterFingerprint: Buffer, path: number[]) {
    const buf = new BufferWriter();
    this.writeBip32Derivation(buf, masterFingerprint, path);
    return buf.buffer();
  }
  private decodeBip32Derivation(buffer: Buffer): {
    masterFingerprint: Buffer;
    path: number[];
  } {
    const buf = new BufferReader(buffer);
    return this.readBip32Derivation(buf);
  }
  private writeBip32Derivation(
    buf: BufferWriter,
    masterFingerprint: Buffer,
    path: number[]
  ) {
    buf.writeSlice(masterFingerprint);
    path.forEach((element) => {
      buf.writeUInt32(element);
    });
  }
  private readBip32Derivation(buf: BufferReader): {
    masterFingerprint: Buffer;
    path: number[];
  } {
    const masterFingerprint = buf.readSlice(4);
    const path: number[] = [];
    while (buf.offset < buf.buffer.length) {
      path.push(buf.readUInt32());
    }
    return { masterFingerprint, path };
  }
  private encodeTapBip32Derivation(
    hashes: Buffer[],
    masterFingerprint: Buffer,
    path: number[]
  ): Buffer {
    const buf = new BufferWriter();
    buf.writeVarInt(hashes.length);
    hashes.forEach((h) => {
      buf.writeSlice(h);
    });
    this.writeBip32Derivation(buf, masterFingerprint, path);
    return buf.buffer();
  }
  private decodeTapBip32Derivation(buffer: Buffer): {
    hashes: Buffer[];
    masterFingerprint: Buffer;
    path: number[];
  } {
    const buf = new BufferReader(buffer);
    const hashCount = buf.readVarInt();
    const hashes: Buffer[] = [];
    for (let i = 0; i < hashCount; i++) {
      hashes.push(buf.readSlice(32));
    }
    const deriv = this.readBip32Derivation(buf);
    return { hashes, ...deriv };
  }
}
function get(
  map: Map<string, Buffer>,
  keyType: KeyType,
  keyData: Buffer,
  acceptUndefined: boolean
): Buffer | undefined {
  if (!map) throw Error("No such map");
  const key = new Key(keyType, keyData);
  const value = map.get(key.toString());
  if (!value) {
    if (acceptUndefined) {
      return undefined;
    }
    throw new NoSuchEntry(key.toString());
  }
  // Make sure to return a copy, to protect the underlying data.
  return Buffer.from(value);
}
type KeyType = number;

class Key {
  keyType: KeyType;
  keyData: Buffer;
  constructor(keyType: KeyType, keyData: Buffer) {
    this.keyType = keyType;
    this.keyData = keyData;
  }
  toString(): string {
    const buf = new BufferWriter();
    this.toBuffer(buf);
    return buf.buffer().toString("hex");
  }
  serialize(buf: BufferWriter) {
    buf.writeVarInt(1 + this.keyData.length);
    this.toBuffer(buf);
  }
  private toBuffer(buf: BufferWriter) {
    buf.writeUInt8(this.keyType);
    buf.writeSlice(this.keyData);
  }
}
class KeyPair {
  key: Key;
  value: Buffer;
  constructor(key: Key, value: Buffer) {
    this.key = key;
    this.value = value;
  }
  serialize(buf: BufferWriter) {
    this.key.serialize(buf);
    buf.writeVarSlice(this.value);
  }
}
function createKey(buf: Buffer): Key {
  return new Key(buf.readUInt8(0), buf.slice(1));
}
function serializeMap(buf: BufferWriter, map: Map<string, Buffer>) {
  for (const k of map.keys()) {
    const value = map.get(k)!;
    const keyPair = new KeyPair(createKey(Buffer.from(k, "hex")), value);
    keyPair.serialize(buf);
  }
  buf.writeUInt8(0);
}

function b(): Buffer {
  return Buffer.from([]);
}
function set(
  map: Map<string, Buffer>,
  keyType: KeyType,
  keyData: Buffer,
  value: Buffer
) {
  const key = new Key(keyType, keyData);
  map.set(key.toString(), value);
}
function uint32LE(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}
function uint64LE(n: number): Buffer {
  return unsafeTo64bitLE(n);
}
function varint(n: number): Buffer {
  const b = new BufferWriter();
  b.writeVarInt(n);
  return b.buffer();
}
function fromVarint(buf: Buffer): number {
  return new BufferReader(buf).readVarInt();
}
