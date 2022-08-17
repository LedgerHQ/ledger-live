import cbor from "@zondax/cbor";
import { Transaction } from "../../types";
import BigNumber from "bignumber.js";

const bigNumberToArray = (v: BigNumber) => {
  let tmp;

  // Adding byte sign
  let signByte = "00";
  if (v.lt(0)) {
    signByte = "01";
  }

  if (v.toString() === "") {
    // to test with null bigint
    return Buffer.from(signByte, "hex");
  } else {
    tmp = v.toString(16);
    // not sure why it is not padding and buffer does not like it
    if (tmp.length % 2 === 1) tmp = "0" + tmp;
  }

  return Buffer.concat([Buffer.from(signByte, "hex"), Buffer.from(tmp, "hex")]);
};

export const toCBOR = (
  from: Buffer,
  recipient: Buffer,
  tx: Transaction
): Buffer => {
  const {
    method,
    version,
    nonce,
    gasLimit,
    gasPremium,
    gasFeeCap,
    params,
    amount,
  } = tx;
  const answer: any[] = [];

  // "version" field
  answer.push(version);

  // "to" field
  answer.push(recipient);

  // "from" field
  answer.push(from);

  // "nonce" field
  answer.push(nonce);

  // "value"
  let buf = bigNumberToArray(amount);
  answer.push(buf);

  // "gaslimit"
  answer.push(gasLimit.toNumber());

  // "gasfeecap"
  buf = bigNumberToArray(gasFeeCap);
  answer.push(buf);

  // "gaspremium"
  buf = bigNumberToArray(gasPremium);
  answer.push(buf);

  // "method"
  answer.push(method);

  if (params) answer.push(params);
  else answer.push(Buffer.alloc(0));

  return cbor.encode(answer);
};
