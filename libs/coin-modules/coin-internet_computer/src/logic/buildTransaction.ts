import { Expiry, SubmitRequestType } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import {
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
  ICP_FEES,
  MAINNET_LEDGER_CANISTER_ID,
} from "../consts";
import { encodeCanisterIdlFunc, getCanisterIdlFunc, ledgerIdlFactory } from "../network/candid";
import { Transaction } from "../types";
import { derivePrincipalFromPubkey } from "./crypto";

export interface UnsignedTransaction extends Record<string, unknown> {
  request_type: SubmitRequestType;
  canister_id: Principal;
  method_name: string;
  arg: ArrayBuffer;
  sender: Principal;
  ingress_expiry: Expiry;
}

export interface TransferRawRequest {
  to: Uint8Array;
  amount: { e8s: bigint };
  memo: bigint;
  fee: { e8s: bigint };
  created_at_time: [{ timestamp_nanos: bigint }];
  from_subaccount: [];
}

export const createUnsignedSendTransaction = (
  transaction: Transaction,
  pubKey: string,
): { unsignedTransaction: UnsignedTransaction; transferRawRequest: TransferRawRequest } => {
  const toAccount = AccountIdentifier.fromHex(transaction.recipient);

  const transferRawRequest: TransferRawRequest = {
    to: toAccount.toUint8Array(),
    amount: { e8s: BigInt(transaction.amount.toString()) },
    memo: BigInt(transaction.memo ?? 0),
    fee: { e8s: BigInt(ICP_FEES) },
    created_at_time: [{ timestamp_nanos: BigInt(Date.now() * 1000000) }],
    from_subaccount: [],
  };

  const transferIdlFunc = getCanisterIdlFunc(ledgerIdlFactory, "transfer");
  const arg = encodeCanisterIdlFunc(transferIdlFunc, [transferRawRequest]);

  const unsignedTransaction: UnsignedTransaction = {
    request_type: SubmitRequestType.Call,
    canister_id: Principal.fromText(MAINNET_LEDGER_CANISTER_ID),
    method_name: "transfer",
    arg,
    sender: derivePrincipalFromPubkey(pubKey),
    ingress_expiry: new Expiry(DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS),
  };

  return { unsignedTransaction, transferRawRequest };
};
