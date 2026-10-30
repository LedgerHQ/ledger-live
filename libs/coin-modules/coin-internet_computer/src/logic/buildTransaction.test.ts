import { Cbor, Expiry, requestIdOf, SubmitRequestType } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { BigNumber } from "bignumber.js";
import { ICP_FEES, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { getCanisterIdlFunc, ledgerIdlFactory } from "../network/candid";
import { Transaction } from "../types";
import { AccountIdentifier } from "./accountIdentifier";
import { createUnsignedSendTransaction } from "./buildTransaction";

const XPUB =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const EXPECTED_SENDER = "qmja6-ma7bq-kxeep-f3lpi-bmu4n-aefcl-xpc5o-iqbsi-5wi5u-b37vi-wae";
const RECIPIENT = "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417";
const FIXED_MS = 1_700_000_000_000;

type DecodedTransfer = {
  to: Uint8Array;
  amount: { e8s: bigint };
  fee: { e8s: bigint };
  memo: bigint;
  from_subaccount: [];
  created_at_time: [{ timestamp_nanos: bigint }];
};

describe("createUnsignedSendTransaction", () => {
  beforeAll(() => jest.useFakeTimers({ now: FIXED_MS }));
  afterAll(() => jest.useRealTimers());

  it("builds a transfer call to the ledger canister", () => {
    const transaction = {
      amount: new BigNumber(100000000),
      recipient: RECIPIENT,
      memo: "7",
    } as Transaction;

    const { unsignedTransaction, transferRawRequest } = createUnsignedSendTransaction(
      transaction,
      XPUB,
    );

    expect(unsignedTransaction.request_type).toBe(SubmitRequestType.Call);
    expect(unsignedTransaction.method_name).toBe("transfer");
    expect(unsignedTransaction.canister_id.toText()).toBe(MAINNET_LEDGER_CANISTER_ID);
    expect(unsignedTransaction.sender.toText()).toBe(EXPECTED_SENDER);
    expect(unsignedTransaction.ingress_expiry).toBeInstanceOf(Expiry);

    expect(transferRawRequest.amount.e8s).toBe(100000000n);
    expect(transferRawRequest.fee.e8s).toBe(BigInt(ICP_FEES));
    expect(transferRawRequest.memo).toBe(7n);
    expect(transferRawRequest.from_subaccount).toEqual([]);
    expect(transferRawRequest.created_at_time[0].timestamp_nanos).toBe(
      BigInt(FIXED_MS * 1_000_000),
    );

    // The encoded Candid argument (the bytes that get signed) must decode back to the same transfer.
    const transferFunc = getCanisterIdlFunc(ledgerIdlFactory, "transfer");
    const [decoded] = IDL.decode(transferFunc.argTypes, unsignedTransaction.arg) as unknown as [
      DecodedTransfer,
    ];

    expect(Buffer.from(decoded.to).toString("hex")).toBe(
      Buffer.from(AccountIdentifier.fromHex(RECIPIENT).toUint8Array()).toString("hex"),
    );
    expect(decoded.amount.e8s).toBe(100000000n);
    expect(decoded.fee.e8s).toBe(BigInt(ICP_FEES));
    expect(decoded.memo).toBe(7n);
    expect(decoded.from_subaccount).toEqual([]);
    expect(decoded.created_at_time[0].timestamp_nanos).toBe(BigInt(FIXED_MS * 1_000_000));
  });

  // The CBOR the device signs and the request id broadcast tracks: sorted keys, and an expiry of
  // now + 5 min - 60 s drift margin, rounded down to the minute.
  it("encodes the exact envelope content the device signs", () => {
    const transaction = {
      amount: new BigNumber(100000000),
      recipient: RECIPIENT,
      memo: "7",
    } as Transaction;

    const { unsignedTransaction } = createUnsignedSendTransaction(transaction, XPUB);

    expect(Buffer.from(Cbor.encode({ content: unsignedTransaction })).toString("hex")).toBe(
      "d9d9f7a167636f6e74656e74a66361726758824449444c066d7b6c01e0a9b302786e006c01d6f68e8001786e036c06fbca0100c6fcb60201ba89e5c20478a2de94eb060282f3f3910c04d8a38ca80d01010520bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf1541710270000000000000700000000000000000100002a36fe9c971700e1f505000000006b63616e69737465725f69644a000000000000000201016e696e67726573735f6578706972791b17979d316f2f98006b6d6574686f645f6e616d65687472616e736665726c726571756573745f747970656463616c6c6673656e646572581d1f0c157211e5dade80b29c6808512eef175c880648ed91da077faa2c02",
    );
    expect(Buffer.from(requestIdOf(unsignedTransaction)).toString("hex")).toBe(
      "406ccfe901bbec444b12502107521a1a8406787ad02f9f33834861d55529c4d2",
    );
  });

  it("defaults the memo to 0 when absent", () => {
    const transaction = { amount: new BigNumber(1), recipient: RECIPIENT } as Transaction;
    const { transferRawRequest } = createUnsignedSendTransaction(transaction, XPUB);
    expect(transferRawRequest.memo).toBe(0n);
  });
});
