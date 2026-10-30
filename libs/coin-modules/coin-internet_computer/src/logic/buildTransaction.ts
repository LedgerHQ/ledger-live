import { Expiry, SubmitRequestType } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import {
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
  MAINNET_LEDGER_CANISTER_ID,
  TRANSFER_FEE,
} from "../consts";
import { encodeCanisterIdlFunc, getCanisterIdlFunc, ledgerIdlFactory } from "../network/candid";
import { Transaction } from "../types";
import { AccountIdentifier } from "./accountIdentifier";
import { derivePrincipalFromPubkey } from "./crypto";

// Keys are declared and built in sorted order: Cbor.encode writes them in insertion order, and the
// signed envelope keeps the sorted-key layout the device app already receives.
export interface UnsignedTransaction extends Record<string, unknown> {
  arg: Uint8Array;
  canister_id: Principal;
  ingress_expiry: Expiry;
  method_name: string;
  request_type: SubmitRequestType;
  sender: Principal;
}

// A 60s permitted-drift margin under the ingress window, so a client clock running ahead of the
// IC still lands inside it.
const PERMITTED_DRIFT_MSECS = 60 * 1000;

export const createIngressExpiry = (): Expiry =>
  Expiry.fromDeltaInMilliseconds(DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS - PERMITTED_DRIFT_MSECS);

export interface TransferRawRequest {
  to: Uint8Array;
  amount: { e8s: bigint };
  memo: bigint;
  fee: { e8s: bigint };
  created_at_time: [{ timestamp_nanos: bigint }];
  from_subaccount: [];
}

export interface Transfer {
  recipient: string;
  amount: bigint;
  memo: bigint;
}

export const createUnsignedSendTransaction = (
  transaction: Transaction,
  pubKey: string,
): { unsignedTransaction: UnsignedTransaction; transferRawRequest: TransferRawRequest } =>
  createUnsignedTransfer(
    {
      recipient: transaction.recipient,
      amount: BigInt(transaction.amount.toString()),
      memo: BigInt(transaction.memo ?? 0),
    },
    pubKey,
  );

export const createUnsignedTransfer = (
  { recipient, amount, memo }: Transfer,
  pubKey: string,
): { unsignedTransaction: UnsignedTransaction; transferRawRequest: TransferRawRequest } => {
  const toAccount = AccountIdentifier.fromHex(recipient);

  const transferRawRequest: TransferRawRequest = {
    to: toAccount.toUint8Array(),
    amount: { e8s: amount },
    memo,
    fee: { e8s: TRANSFER_FEE },
    created_at_time: [{ timestamp_nanos: BigInt(Date.now() * 1000000) }],
    from_subaccount: [],
  };

  const transferIdlFunc = getCanisterIdlFunc(ledgerIdlFactory, "transfer");
  const arg = encodeCanisterIdlFunc(transferIdlFunc, [transferRawRequest]);

  const unsignedTransaction: UnsignedTransaction = {
    arg,
    canister_id: Principal.fromText(MAINNET_LEDGER_CANISTER_ID),
    ingress_expiry: createIngressExpiry(),
    method_name: "transfer",
    request_type: SubmitRequestType.Call,
    sender: derivePrincipalFromPubkey(pubKey),
  };

  return { unsignedTransaction, transferRawRequest };
};
