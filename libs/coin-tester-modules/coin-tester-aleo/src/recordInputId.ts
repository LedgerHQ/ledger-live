/**
 * A record-typed entry of `ExecutionRequest.input_ids()`:
 * `[commitment, gamma, record_view_key, serial_number, tag]`. Every other
 * input type is a bare `Field`, so a plain array check tells them apart.
 */
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
