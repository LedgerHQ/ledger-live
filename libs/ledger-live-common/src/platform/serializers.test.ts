import type { SignedOperation, SignedOperationRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

import "../__tests__/test-helpers/setup";

import {
  serializePlatformSignedTransaction,
  deserializePlatformSignedTransaction,
} from "./serializers";

const SIGNED_TRANSACTION: SignedOperation = {
  operation: {
    id: "js:2:ethereum:0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX:--OUT",
    hash: "",
    type: "OUT",
    senders: ["0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX"],
    recipients: ["0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX"],
    accountId: "js:2:ethereum:0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX:",
    blockHash: null,
    blockHeight: null,
    extra: {},
    date: new Date("2021-08-24T12:33:40.584Z"),
    value: new BigNumber("1"),
    fee: new BigNumber("2091600000000000"),
    transactionSequenceNumber: 15,
  },
  signature:
    "0xf8640f850f75bf9800827b0c943f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX018025a058693cad6ee2299f034ffa04287faba5e777b30659e5bb29bcefdb8284285c97a022169e3ec2a894a35c6edf4223ca6cb3c24453cea78d474d29d1252a236e132b",
  expirationDate: null,
};

const RAW_SIGNED_TRANSACTION: SignedOperationRaw = {
  operation: {
    id: "js:2:ethereum:0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX:--OUT",
    hash: "",
    type: "OUT",
    senders: ["0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX"],
    recipients: ["0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX"],
    accountId: "js:2:ethereum:0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX:",
    blockHash: null,
    blockHeight: null,
    extra: {},
    date: "2021-08-24T12:33:40.584Z",
    value: "1",
    fee: "2091600000000000",
    transactionSequenceNumber: 15,
  },
  signature:
    "0xf8640f850f75bf9800827b0c943f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX018025a058693cad6ee2299f034ffa04287faba5e777b30659e5bb29bcefdb8284285c97a022169e3ec2a894a35c6edf4223ca6cb3c24453cea78d474d29d1252a236e132b",
  expirationDate: null,
};

const ACCOUNT_ID = "js:2:ethereum:0x3f87926741ecaXXXXXXXXXXXXXXXXXXXXXXXXXXX:";

test("should serialize a platform signed transaction", () => {
  const serializedSignedTransaction =
    serializePlatformSignedTransaction(SIGNED_TRANSACTION);

  expect(serializedSignedTransaction).toEqual(RAW_SIGNED_TRANSACTION);
});

test("should deserialize a raw platform signed transaction", () => {
  const signedTransaction = deserializePlatformSignedTransaction(
    RAW_SIGNED_TRANSACTION,
    ACCOUNT_ID
  );

  expect(signedTransaction).toEqual(SIGNED_TRANSACTION);
});

describe("Serialize -> Deserialize flow", () => {
  test("should not alter signedTransaction", () => {
    const serializedSignedTransaction =
      serializePlatformSignedTransaction(SIGNED_TRANSACTION);

    const stringifiedSignedTransaction = JSON.stringify(
      serializedSignedTransaction
    );

    const parsedSignedTransaction = JSON.parse(
      stringifiedSignedTransaction
    ) as SignedOperationRaw;

    const expectedSignedTransaction = deserializePlatformSignedTransaction(
      parsedSignedTransaction,
      ACCOUNT_ID
    );

    const signedTransaction = deserializePlatformSignedTransaction(
      RAW_SIGNED_TRANSACTION,
      ACCOUNT_ID
    );

    expect(signedTransaction).toEqual(expectedSignedTransaction);
  });
});
