/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AnnotatedCellInput,
  AnnotatedRawTransaction,
  AnnotatedTransaction,
  Byte32,
  Bytes,
  CellDep,
  CellInput,
  CellOutput,
  OutPoint,
  RawTransaction,
  Script,
  Uint32,
  Uint64,
} from "./types";

const Uint32Size = 4;
const Uint64Size = 8;
const Byte32Size = 32;
const OutPointSize = Byte32Size + Uint32Size;
const CellDepSize = OutPointSize + 1;
const CellInputSize = Uint64Size + OutPointSize;

function assertArrayBuffer(reader: string, padTo?: number) {
  let buffer: Buffer | undefined;
  reader = reader.replace(/^0x/, "");
  if (padTo !== undefined) {
    // padTo is defined for numbers, which are stored bigendian and non-multiple-of-2.
    reader = reader.padStart(padTo * 2, "0");
    buffer = Buffer.from(reader.match(/../g)!.reverse().join(""), "hex");
  } else {
    buffer = Buffer.from(reader, "hex");
  }
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

function dataLengthError(actual: number, required: number) {
  throw new Error(
    `Invalid data length! Required: ${required}, actual: ${actual}`
  );
}

function assertDataLength(actual: number, required: number) {
  if (actual !== required) {
    dataLengthError(actual, required);
  }
}

export function SerializeByte32(value: Byte32): ArrayBuffer {
  const buffer = assertArrayBuffer(value);
  assertDataLength(buffer.byteLength, 32);
  return buffer;
}

export function SerializeByte32Vec(value: Byte32[]): ArrayBuffer {
  const array = new Uint8Array(4 + Byte32Size * value.length);
  new DataView(array.buffer).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = SerializeByte32(value[i]);
    array.set(new Uint8Array(itemBuffer), 4 + i * Byte32Size);
  }
  return array.buffer;
}

export function SerializeUint32(value: Uint32): ArrayBuffer {
  const tmp = new ArrayBuffer(4);
  const tmpDV = new DataView(tmp);
  tmpDV.setInt32(0, value, true);
  return tmp;
}

export function SerializeUint64(value: Uint64): ArrayBuffer {
  const buffer = assertArrayBuffer(value, 8);
  assertDataLength(buffer.byteLength, 8);
  return buffer;
}

export function SerializeBytes(value: Bytes): ArrayBuffer {
  const item = assertArrayBuffer(value);
  const array = new Uint8Array(4 + item.byteLength);
  new DataView(array.buffer).setUint32(0, item.byteLength, true);
  array.set(new Uint8Array(item), 4);
  return array.buffer;
}

export function SerializeBytesOpt(value?: Bytes): ArrayBuffer {
  if (value) {
    return SerializeBytes(value);
  } else {
    return new ArrayBuffer(0);
  }
}

function serializeTable(buffers: ArrayBuffer[]) {
  const itemCount = buffers.length;
  let totalSize = 4 * (itemCount + 1);
  const offsets: number[] = [];
  for (let i = 0; i < itemCount; i++) {
    offsets.push(totalSize);
    totalSize += buffers[i].byteLength;
  }
  const buffer = new ArrayBuffer(totalSize);
  const array = new Uint8Array(buffer);
  const view = new DataView(buffer);
  view.setUint32(0, totalSize, true);
  for (let i = 0; i < itemCount; i++) {
    view.setUint32(4 + i * 4, offsets[i], true);
    array.set(new Uint8Array(buffers[i]), offsets[i]);
  }
  return buffer;
}

export function SerializeBytesVec(value: Bytes[]): ArrayBuffer {
  return serializeTable(value.map((item) => SerializeBytes(item)));
}

export function SerializeBip32(value: Uint32[]): ArrayBuffer {
  const array = new Uint8Array(4 + Uint32Size * value.length);
  new DataView(array.buffer).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = SerializeUint32(value[i]);
    array.set(new Uint8Array(itemBuffer), 4 + i * Uint32Size);
  }
  return array.buffer;
}

export function SerializeOutPoint(value: OutPoint): ArrayBuffer {
  const array = new Uint8Array(0 + Byte32Size + Uint32Size);
  array.set(new Uint8Array(SerializeByte32(value.txHash)), 0);
  array.set(new Uint8Array(SerializeUint32(value.index)), 0 + Byte32Size);
  return array.buffer;
}

export function SerializeScript(value: Script): ArrayBuffer {
  const buffers: ArrayBuffer[] = [];
  buffers.push(SerializeByte32(value.codeHash));
  const hashTypeView = new DataView(new ArrayBuffer(1));
  hashTypeView.setUint8(0, value.hashType);
  buffers.push(hashTypeView.buffer);
  buffers.push(SerializeBytes(value.args));
  return serializeTable(buffers);
}

export function SerializeScriptOpt(value?: Script): ArrayBuffer {
  if (value) {
    return SerializeScript(value);
  } else {
    return new ArrayBuffer(0);
  }
}

export function SerializeCellDep(value: CellDep): ArrayBuffer {
  const array = new Uint8Array(0 + OutPointSize + 1);
  array.set(new Uint8Array(SerializeOutPoint(value.outPoint)), 0);
  const view = new DataView(array.buffer);
  view.setUint8(0 + OutPointSize, value.depType);
  return array.buffer;
}

export function SerializeCellDepVec(value: CellDep[]): ArrayBuffer {
  const array = new Uint8Array(4 + CellDepSize * value.length);
  new DataView(array.buffer).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = SerializeCellDep(value[i]);
    array.set(new Uint8Array(itemBuffer), 4 + i * CellDepSize);
  }
  return array.buffer;
}

export function SerializeCellInput(value: CellInput): ArrayBuffer {
  const array = new Uint8Array(0 + Uint64Size + OutPointSize);
  array.set(new Uint8Array(SerializeUint64(value.since)), 0);
  array.set(
    new Uint8Array(SerializeOutPoint(value.previousOutput)),
    0 + Uint64Size
  );
  return array.buffer;
}

export function SerializeCellInputVec(value: CellInput[]): ArrayBuffer {
  const array = new Uint8Array(4 + CellInputSize * value.length);
  new DataView(array.buffer).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = SerializeCellInput(value[i]);
    array.set(new Uint8Array(itemBuffer), 4 + i * CellInputSize);
  }
  return array.buffer;
}

export function SerializeAnnotatedCellInput(
  value: AnnotatedCellInput
): ArrayBuffer {
  const buffers: ArrayBuffer[] = [];
  buffers.push(SerializeCellInput(value.input));
  buffers.push(SerializeRawTransaction(value.source));
  return serializeTable(buffers);
}

export function SerializeAnnotatedCellInputVec(
  value: AnnotatedCellInput[]
): ArrayBuffer {
  return serializeTable(value.map((item) => SerializeAnnotatedCellInput(item)));
}

export function SerializeCellOutput(value: CellOutput): ArrayBuffer {
  const buffers: ArrayBuffer[] = [];
  buffers.push(SerializeUint64(value.capacity));
  buffers.push(SerializeScript(value.lock));
  buffers.push(SerializeScriptOpt(value.type));
  return serializeTable(buffers);
}

export function SerializeCellOutputVec(value: Array<CellOutput>): ArrayBuffer {
  return serializeTable(value.map((item) => SerializeCellOutput(item)));
}

export function SerializeRawTransaction(value: RawTransaction): ArrayBuffer {
  const buffers: ArrayBuffer[] = [];
  buffers.push(SerializeUint32(value.version));
  buffers.push(SerializeCellDepVec(value.cellDeps));
  buffers.push(SerializeByte32Vec(value.headerDeps));
  buffers.push(SerializeCellInputVec(value.inputs));
  buffers.push(SerializeCellOutputVec(value.outputs));
  buffers.push(SerializeBytesVec(value.outputsData));
  return serializeTable(buffers);
}

export function SerializeAnnotatedRawTransaction(
  value: AnnotatedRawTransaction
): ArrayBuffer {
  const buffers: ArrayBuffer[] = [];
  buffers.push(SerializeUint32(value.version));
  buffers.push(SerializeCellDepVec(value.cellDeps));
  buffers.push(SerializeByte32Vec(value.headerDeps));
  buffers.push(SerializeAnnotatedCellInputVec(value.inputs));
  buffers.push(SerializeCellOutputVec(value.outputs));
  buffers.push(SerializeBytesVec(value.outputsData));
  return serializeTable(buffers);
}

export function SerializeAnnotatedTransaction(
  value: AnnotatedTransaction
): ArrayBuffer {
  const buffers: ArrayBuffer[] = [];
  buffers.push(SerializeBip32(value.signPath));
  buffers.push(SerializeBip32(value.changePath));
  buffers.push(SerializeUint32(value.inputCount));
  buffers.push(SerializeAnnotatedRawTransaction(value.raw));
  buffers.push(SerializeBytesVec(value.witnesses));
  return serializeTable(buffers);
}
