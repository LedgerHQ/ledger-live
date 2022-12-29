import { ICPTs, Subaccount } from "@dfinity/nns/dist/proto/ledger_pb";
import {
  NANOSECONDS_PER_MILLISECONDS,
  REPLICA_PERMITTED_DRIFT_MILLISECONDS,
} from "./consts";
import * as cbor from "simple-cbor";
import { lebEncode } from "@dfinity/candid";

export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

export const toICPTs = (amount: bigint): ICPTs => {
  const result = new ICPTs();
  result.setE8s(amount.toString(10));
  return result;
};

export const subAccountNumbersToSubaccount = (
  subAccountNumbers: number[]
): Subaccount => {
  const bytes = new Uint8Array(subAccountNumbers).buffer;
  const subaccount: Subaccount = new Subaccount();
  subaccount.setSubAccount(new Uint8Array(bytes));
  return subaccount;
};

export class Expiry {
  private readonly _value: bigint;

  constructor(deltaInMSec: number, date: Date) {
    // Use bigint because it can overflow the maximum number allowed in a double float.
    this._value =
      (BigInt(date.getTime()) +
        BigInt(deltaInMSec) -
        REPLICA_PERMITTED_DRIFT_MILLISECONDS) *
      NANOSECONDS_PER_MILLISECONDS;
  }

  public toCBOR(): cbor.CborValue {
    return cbor.value.u64(this._value.toString(16), 16);
  }

  public toHash(): ArrayBuffer {
    return lebEncode(this._value);
  }
}
