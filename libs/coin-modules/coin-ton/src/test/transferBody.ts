import { Cell, loadMessageRelaxed } from "@ton/core";
import { JettonOpCode } from "../constants";
import type { TonPayloadComment, TonPayloadJettonTransfer } from "../types";

export function decodeTransferBody(body: Cell | string) {
  const slice = (typeof body === "string" ? Cell.fromBase64(body) : body).beginParse();
  const subwalletId = slice.loadUint(32);
  const validUntil = slice.loadUint(32);
  const seqno = slice.loadUint(32);
  const op = slice.loadUint(8);
  const sendMode = slice.loadUint(8);
  const message = loadMessageRelaxed(slice.loadRef().beginParse());
  slice.endParse();
  if (message.info.type !== "internal") throw new Error("Not an internal message");

  return {
    subwalletId,
    validUntil,
    seqno,
    op,
    sendMode,
    to: message.info.dest,
    bounce: message.info.bounce,
    amount: message.info.value.coins,
    init: message.init ?? null,
    payload: message.body.bits.length > 0 || message.body.refs.length > 0 ? message.body : null,
  };
}

export function decodePayload(payload: Cell): TonPayloadComment | TonPayloadJettonTransfer {
  const slice = payload.beginParse();
  const op = slice.loadUint(32);
  if (op === 0) return { type: "comment", text: slice.loadStringTail() };
  if (op !== JettonOpCode.Transfer) throw new Error(`Not a comment nor a jetton transfer: ${op}`);

  return {
    type: "jetton-transfer",
    queryId: slice.loadUintBig(64),
    amount: slice.loadCoins(),
    destination: slice.loadAddress(),
    responseDestination: slice.loadAddress(),
    customPayload: slice.loadMaybeRef(),
    forwardAmount: slice.loadCoins(),
    forwardPayload: slice.loadMaybeRef(),
    knownJetton: null,
  };
}
