export type byte = number;
export type Uint32 = number;
export type Uint64 = string;
export type Byte32 = string;
export type Bytes = string;

export interface OutPoint {
  txHash: Byte32;
  index: Uint32;
}

export interface Script {
  codeHash: Byte32;
  hashType: byte;
  args: Bytes;
}

export interface CellDep {
  outPoint: OutPoint;
  depType: byte;
}

export interface CellInput {
  since: Uint64;
  previousOutput: OutPoint;
}

export interface CellOutput {
  capacity: Uint64;
  lock: Script;
  type?: Script;
}

export interface AnnotatedCellInput {
  input: CellInput;
  source: RawTransaction;
}

export interface RawTransaction {
  version: Uint32;
  cellDeps: CellDep[];
  headerDeps: Byte32[];
  inputs: CellInput[];
  outputs: CellOutput[];
  outputsData: Bytes[];
}

export interface AnnotatedRawTransaction {
  version: Uint32;
  cellDeps: CellDep[];
  headerDeps: Byte32[];
  inputs: AnnotatedCellInput[];
  outputs: CellOutput[];
  outputsData: Bytes[];
}

export interface AnnotatedTransaction {
  signPath: Uint32[];
  changePath: Uint32[];
  inputCount: Uint32;
  raw: AnnotatedRawTransaction;
  witnesses: Bytes[];
}
