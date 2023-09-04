import cbor from "@zondax/cbor";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

import { Transaction } from "../../types";
import { getAddress } from "./utils";
import { validateAddress } from "./addresses";

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

export const toCBOR = (account: Account, tx: Transaction): Buffer => {
  const { address: from } = getAddress(account);
  const { method, version, nonce, gasLimit, gasPremium, gasFeeCap, params, amount, recipient } = tx;
  const answer: any[] = [];

  const recipientBytes = validateAddress(recipient);
  const fromBytes = validateAddress(from);

  if (!recipientBytes.isValid || !fromBytes.isValid)
    throw new Error("recipient and/or from address are not valid");

  // "version" field
  answer.push(version);

  // "to" field
  answer.push(recipientBytes.bytes);

  // "from" field
  answer.push(fromBytes.bytes);

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
