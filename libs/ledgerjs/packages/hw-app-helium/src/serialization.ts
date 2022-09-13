import Address from "@helium/address";
import {
  PaymentV2,
  StakeValidatorV1,
  TokenBurnV1,
  TransferValidatorStakeV1,
  UnstakeValidatorV1,
  SecurityExchangeV1,
  TokenType,
} from "@helium/transactions";
import BigNumber from "bignumber.js";
import BIPPath from "bip32-path";
import JSLong from "long";

const tokenTypeToInt = (tokenType) => {
  if (!tokenType) return 0;

  switch (tokenType) {
    default:
    case "hnt":
      return TokenType.hnt;
    case "hst":
      return TokenType.hst;
    case "mobile":
      return TokenType.mobile;
    case "iot":
      return TokenType.iot;
  }
};

const serializePath = (path: number[]): Buffer => {
  const buf = Buffer.alloc(1 + path.length * 4);
  buf.writeUInt8(path.length, 0);
  for (const [i, num] of path.entries()) {
    buf.writeUInt32BE(num, 1 + i * 4);
  }
  return buf;
};

export const pathToBuffer = (originalPath: string): Buffer => {
  const path = originalPath
    .split("/")
    .map((value) =>
      value.endsWith("'") || value.endsWith("h") ? value : value + "'"
    )
    .join("/");
  const pathNums: number[] = BIPPath.fromString(path).toPathArray();
  return serializePath(pathNums);
};

const serializeNumber = (amount: number | BigNumber | undefined): Buffer => {
  let hex = new BigNumber(amount ?? 0).toString(16);
  hex = hex.length % 2 ? `0${hex}` : hex;
  const len = Math.floor(hex.length / 2);
  if (len > 8) throw "Invalid transaction.";
  const u8 = new Uint8Array(8);
  for (let i = 0; i < len; i += 1)
    u8[len - i - 1] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return Buffer.from(u8);
};

const serializeMemo = (memo: string) => {
  const memoBuffer = Buffer.from(memo, "base64");
  const memoLong = JSLong.fromBytes(Array.from(memoBuffer), true, true);
  return Buffer.from(memoLong.toBytesLE());
};

export const serializePaymentV2 = (txn: PaymentV2): Buffer => {
  if (txn.payments.length > 1) throw "multiple payments are not supported";

  const { amount, memo } = txn.payments[0];
  const payee = txn.payments[0].payee as Address;
  const tokenType = tokenTypeToInt(txn.payments[0].tokenType);

  const txSerialized = Buffer.concat([
    serializeNumber(amount),
    serializeNumber(txn.fee),
    serializeNumber(txn.nonce),
    Buffer.from([payee.version]),
    Buffer.from([payee.netType | payee.keyType]),
    Buffer.from(payee.publicKey),
    serializeMemo(memo || ""),
    serializeNumber(tokenType),
  ]);

  return Buffer.from(txSerialized);
};

export const serializeSecurityExchangeV1 = (
  txn: SecurityExchangeV1
): Buffer => {
  if (!txn.payee) throw "Payee required";

  const payee = txn.payee as Address;

  const txSerialized = Buffer.concat([
    serializeNumber(txn.amount),
    serializeNumber(txn.fee),
    serializeNumber(txn.nonce),
    Buffer.from([payee.version]),
    Buffer.from([payee.netType | payee.keyType]),
    Buffer.from(payee.publicKey),
  ]);

  return Buffer.from(txSerialized);
};

export const serializeTokenBurnV1 = (txn: TokenBurnV1): Buffer => {
  if (!txn.payee) throw "Payee required";

  const payee = txn.payee as Address;

  const txSerialized = Buffer.concat([
    serializeNumber(txn.amount),
    serializeNumber(txn.fee),
    serializeNumber(txn.nonce),
    serializeMemo(txn.memo),
    Buffer.from([payee.version]),
    Buffer.from([payee.netType | payee.keyType]),
    Buffer.from(payee.publicKey),
  ]);

  return Buffer.from(txSerialized);
};

export const serializeStakeValidatorV1 = (txn: StakeValidatorV1): Buffer => {
  if (!txn.address) throw "Address required";

  const address = txn.address as Address;

  const txSerialized = Buffer.concat([
    serializeNumber(txn.stake),
    serializeNumber(txn.fee),
    Buffer.from([address.version]),
    Buffer.from([address.netType | address.keyType]),
    Buffer.from(address.publicKey),
  ]);

  return Buffer.from(txSerialized);
};

export const serializeTransferValidatorStakeV1 = (
  txn: TransferValidatorStakeV1
): Buffer => {
  if (!txn.newOwner) throw "New owner required";
  if (!txn.oldOwner) throw "Old owner required";
  if (!txn.newAddress) throw "New address required";
  if (!txn.oldAddress) throw "Old address required";

  const newOwner = txn.newOwner as Address;
  const oldOwner = txn.oldOwner as Address;
  const newAddress = txn.newAddress as Address;
  const oldAddress = txn.oldAddress as Address;

  const txSerialized = Buffer.concat([
    serializeNumber(txn.stakeAmount),
    serializeNumber(txn.paymentAmount),
    serializeNumber(txn.fee),
    Buffer.from([newOwner.version]),
    Buffer.from([newOwner.keyType]),
    Buffer.from(newOwner.publicKey),
    Buffer.from([oldOwner.version]),
    Buffer.from([oldOwner.keyType]),
    Buffer.from(oldOwner.publicKey),
    Buffer.from([newAddress.version]),
    Buffer.from([newAddress.keyType]),
    Buffer.from(newAddress.publicKey),
    Buffer.from([oldAddress.version]),
    Buffer.from([oldAddress.netType | oldAddress.keyType]),
    Buffer.from(oldAddress.publicKey),
  ]);

  return Buffer.from(txSerialized);
};

export const serializeUnstakeValidatorV1 = (
  txn: UnstakeValidatorV1
): Buffer => {
  if (!txn.address) throw "Address required";

  const address = txn.address as Address;

  const txSerialized = Buffer.concat([
    serializeNumber(txn.stakeAmount),
    serializeNumber(txn.stakeReleaseHeight),
    serializeNumber(txn.fee),
    Buffer.from([address.version]),
    Buffer.from([address.netType | address.keyType]),
    Buffer.from(address.publicKey),
  ]);

  return Buffer.from(txSerialized);
};
