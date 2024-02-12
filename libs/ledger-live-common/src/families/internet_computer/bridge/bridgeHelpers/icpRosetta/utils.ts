import * as cbor from "simple-cbor";
import {
  ICPRosettaConstructionCombineRequest,
  ICPRosettaConstructionPayloadsResponse,
  ICPRosettaICPRosettaOperation,
} from "./types";
import { PipeArrayBuffer } from "@dfinity/candid";
import BigInteger from "big-integer";
import { Transaction } from "../../../types";
import { Account } from "@ledgerhq/types-live";
import { getAddress } from "../addresses";
import BigNumber from "bignumber.js";

export const generateOperations = (
  tr: Transaction,
  a: Account,
): ICPRosettaICPRosettaOperation[] => {
  const { address } = getAddress(a);
  const currency = {
    symbol: "ICP",
    decimals: 8,
  };
  const type = "TRANSACTION";
  const operations: ICPRosettaICPRosettaOperation[] = [];
  operations.push({
    operation_identifier: {
      index: 0,
    },
    type,
    account: {
      address,
    },
    amount: {
      value: `-${tr.amount}`,
      currency,
    },
  });

  operations.push({
    operation_identifier: {
      index: 1,
    },
    type,
    account: {
      address: tr.recipient,
    },
    amount: {
      value: `${tr.amount}`,
      currency,
    },
  });

  operations.push({
    operation_identifier: {
      index: 2,
    },
    type: "FEE",
    account: {
      address,
    },
    amount: {
      value: `-${tr.fees}`,
      currency,
    },
  });

  return operations;
};

function expiryEncode(val: BigNumber): ArrayBuffer {
  let value = BigInteger(val.toString());

  if (value < BigInteger(0)) {
    throw new Error("Cannot leb encode negative values.");
  }

  const byteLength = (value === BigInteger(0) ? 0 : Math.ceil(Math.log2(Number(value)))) + 1;
  const pipe = new PipeArrayBuffer(new ArrayBuffer(byteLength), 0);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const i = Number(value.and(BigInteger(0x7f)));
    value = value.divide(BigInteger(0x80));
    if (value.eq(BigInteger(0))) {
      pipe.write(new Uint8Array([i]));
      break;
    } else {
      pipe.write(new Uint8Array([i | 0x80]));
    }
  }

  return pipe.buffer;
}

export class ingressExpiry {
  value: BigNumber;

  constructor(value: BigNumber) {
    // Use bigint because it can overflow the maximum number allowed in a double float.
    this.value = value;
  }

  public toCBOR(): cbor.CborValue {
    return cbor.value.u64(this.value.toString(16), 16);
  }

  public toHash(): ArrayBuffer {
    return expiryEncode(this.value);
  }
}

export const generateSignaturesPayload = (
  signs: { txnSig: string; readSig: string },
  payloads: ICPRosettaConstructionPayloadsResponse["payloads"],
  pubkey: string,
): ICPRosettaConstructionCombineRequest["signatures"] => {
  const signatures: ICPRosettaConstructionCombineRequest["signatures"] = [];
  const [txnPayload, readStatePayload] = payloads;
  signatures.push({
    signing_payload: {
      account_identifier: {
        address: txnPayload.account_identifier.address,
      },
      hex_bytes: txnPayload.hex_bytes,
      signature_type: txnPayload.signature_type,
    },
    public_key: {
      hex_bytes: pubkey,
      curve_type: "secp256k1",
    },
    signature_type: "ecdsa",
    hex_bytes: signs.txnSig,
  });

  signatures.push({
    signing_payload: {
      account_identifier: {
        address: readStatePayload.account_identifier.address,
      },
      hex_bytes: readStatePayload.hex_bytes,
      signature_type: readStatePayload.signature_type,
    },
    public_key: {
      hex_bytes: pubkey,
      curve_type: "secp256k1",
    },
    signature_type: "ecdsa",
    hex_bytes: signs.readSig,
  });

  return signatures;
};
