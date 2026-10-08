// Non-record entries of `ExecutionRequest.input_ids()` are a bare `Field`, never an array.
export type RecordInputId = [
  commitment: { toString(): string },
  gamma: { toBytesLe(): Uint8Array },
  recordViewKey: unknown,
  serialNumber: unknown,
  tag: unknown,
];

export function isRecordInputId(id: unknown): id is RecordInputId {
  return Array.isArray(id);
}
