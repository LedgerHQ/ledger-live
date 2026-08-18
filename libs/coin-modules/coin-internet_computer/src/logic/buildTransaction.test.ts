import { Expiry, SubmitRequestType } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { BigNumber } from "bignumber.js";
import { ICP_FEES, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { getCanisterIdlFunc, ledgerIdlFactory } from "../network/candid";
import { Transaction } from "../types";
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

  it("defaults the memo to 0 when absent", () => {
    const transaction = { amount: new BigNumber(1), recipient: RECIPIENT } as Transaction;
    const { transferRawRequest } = createUnsignedSendTransaction(transaction, XPUB);
    expect(transferRawRequest.memo).toBe(0n);
  });
});
