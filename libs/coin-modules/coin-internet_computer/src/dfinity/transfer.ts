import { AccountIdentifier } from "@icp-sdk/canisters/ledger/icp";
import { Cbor, Expiry, SubmitRequestType } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
export { Cbor };
import { ledgerIdlFactory, getCanisterIdlFunc, encodeCanisterIdlFunc } from "./candid";
import {
  ICP_FEES,
  MAINNET_LEDGER_CANISTER_ID,
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
} from "./consts";
import { derivePrincipalFromPubkey, validatePublicKey } from "./public-key";
import { validateAddress } from "./validation";

/**
 * Represents an unsigned transaction for the Internet Computer.
 */
export interface UnsignedTransaction extends Record<string, unknown> {
  request_type: SubmitRequestType;
  canister_id: Principal;
  method_name: string;
  arg: ArrayBuffer;
  sender: Principal;
  ingress_expiry: Expiry;
}

/**
 * Raw request structure for ICP transfers.
 */
export interface TransferRawRequest {
  to: Uint8Array;
  amount: { e8s: bigint };
  memo: bigint;
  fee: { e8s: bigint };
  created_at_time: [{ timestamp_nanos: bigint }];
  from_subaccount: [];
}

/**
 * Type-safe input for transfer transactions.
 */
export interface TransferInput {
  recipient: string;
  amount: bigint | string;
  memo?: number;
}

/**
 * Creates an unsigned transaction for sending ICP tokens.
 */
export const createUnsignedSendTransaction = (
  transaction: TransferInput,
  pubKey: string,
): { unsignedTransaction: UnsignedTransaction; transferRawRequest: TransferRawRequest } => {
  const addressValidation = validateAddress(transaction.recipient);
  if (!addressValidation.isValid) {
    throw new Error(addressValidation.error || "Invalid recipient address");
  }
  validatePublicKey(pubKey);
  const toAccount = AccountIdentifier.fromHex(transaction.recipient);

  const transferRawRequest: TransferRawRequest = {
    to: toAccount.toUint8Array(),
    amount: { e8s: BigInt(transaction.amount.toString()) },
    memo: BigInt(transaction.memo ?? 0),
    fee: { e8s: BigInt(ICP_FEES) },
    created_at_time: [{ timestamp_nanos: BigInt(new Date().getTime() * 1000000) }],
    from_subaccount: [],
  };

  const transferIdlFunc = getCanisterIdlFunc(ledgerIdlFactory, "transfer");
  const args = encodeCanisterIdlFunc(transferIdlFunc, [transferRawRequest]);

  const canisterID = Principal.from(MAINNET_LEDGER_CANISTER_ID);
  const unsignedTransaction: UnsignedTransaction = {
    request_type: SubmitRequestType.Call,
    canister_id: canisterID,
    method_name: "transfer",
    arg: args,
    sender: derivePrincipalFromPubkey(pubKey),
    ingress_expiry: Expiry.fromDeltaInMilliseconds(DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS),
  };

  return { unsignedTransaction, transferRawRequest };
};
