import type {
  EntryFunctionPayloadResponse,
  MultisigPayloadResponse,
  TransactionPayloadResponse,
} from "@aptos-labs/ts-sdk";
import type { AptosTransaction } from "../types";

const MULTISIG_PAYLOAD = "multisig_payload";
const FEE_PAYER_SIGNATURE = "fee_payer_signature";

export const isMultisigPayload = (
  payload: TransactionPayloadResponse | undefined,
): payload is MultisigPayloadResponse =>
  payload?.type === MULTISIG_PAYLOAD && "multisig_address" in payload;

export const getEntryFunctionPayload = (
  payload: TransactionPayloadResponse | undefined,
): EntryFunctionPayloadResponse | undefined => {
  const executedPayload = isMultisigPayload(payload) ? payload.transaction_payload : payload;

  return executedPayload && "function" in executedPayload ? executedPayload : undefined;
};

export const getFundsOwner = (tx: AptosTransaction): string =>
  isMultisigPayload(tx.payload) ? tx.payload.multisig_address : tx.sender;

export const getFeesPayer = (tx: AptosTransaction): string =>
  tx.signature?.type === FEE_PAYER_SIGNATURE && "fee_payer_address" in tx.signature
    ? tx.signature.fee_payer_address
    : tx.sender;
