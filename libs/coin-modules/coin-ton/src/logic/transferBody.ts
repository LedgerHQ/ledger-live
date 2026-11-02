import { Address, Cell, beginCell } from "@ton/core";
import { JettonOpCode, TOKEN_TRANSFER_FORWARD_AMOUNT, TOKEN_TRANSFER_QUERY_ID } from "../constants";

/** Wallet v4's default subwallet, the one the Ledger app signs for when given no specifier. */
export const DEFAULT_SUBWALLET_ID = 698983191;

export type TonTransferOrder = {
  seqno: number;
  validUntil: number;
  sendMode: number;
  to: Address;
  bounce: boolean;
  amount: bigint;
  payload: Cell | null;
};

/**
 * Laid out exactly as `@ton-community/ton-ledger` rebuilds it to check the device's hash: the
 * payload always sits in a reference, where `@ton/ton`'s `createTransfer` inlines a short one.
 */
export function buildTransferBody(order: TonTransferOrder): Cell {
  const message = beginCell()
    .storeBit(0) // internal message
    .storeBit(true) // ihr_disabled
    .storeBit(order.bounce)
    .storeBit(false) // bounced
    .storeAddress(null)
    .storeAddress(order.to)
    .storeCoins(order.amount)
    .storeBit(false) // no extra currency
    .storeCoins(0) // ihr_fee
    .storeCoins(0) // fwd_fee
    .storeUint(0, 64) // created_lt
    .storeUint(0, 32) // created_at
    .storeBit(false) // no StateInit for the recipient
    .storeMaybeRef(order.payload);

  return beginCell()
    .storeUint(DEFAULT_SUBWALLET_ID, 32)
    .storeUint(order.validUntil, 32)
    .storeUint(order.seqno, 32)
    .storeUint(0, 8) // simple send
    .storeUint(order.sendMode, 8)
    .storeRef(message.endCell())
    .endCell();
}

export const readSeqno = (body: Cell): number => body.beginParse().skip(64).loadUint(32);

export const jettonTransferPayload = ({
  amount,
  destination,
  responseDestination,
  forwardPayload,
}: {
  amount: bigint;
  destination: Address;
  responseDestination: Address;
  forwardPayload: Cell | null;
}): Cell =>
  beginCell()
    .storeUint(JettonOpCode.Transfer, 32)
    .storeUint(TOKEN_TRANSFER_QUERY_ID, 64)
    .storeCoins(amount)
    .storeAddress(destination)
    .storeAddress(responseDestination)
    .storeMaybeRef(null) // custom payload
    .storeCoins(TOKEN_TRANSFER_FORWARD_AMOUNT)
    .storeMaybeRef(forwardPayload)
    .endCell();
