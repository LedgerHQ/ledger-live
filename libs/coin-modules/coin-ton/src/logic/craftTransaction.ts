import type {
  CraftedTransaction,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { Address, SendMode, comment, toNano } from "@ton/core";
import type { TonContext } from "../config";
import { TOKEN_TRANSFER_MAX_FEE } from "../constants";
import { fetchJettonWallets } from "../network";
import type { TonMemo } from "../types";
import { getNextSequence } from "./getNextSequence";
import { type TonTransferOrder, buildTransferBody, jettonTransferPayload } from "./transferBody";

const VALIDITY_SECONDS = 60;

export type TonRecipient = { address: Address; bounce: boolean };

export const commentOf = (intent: TransactionIntent<TonMemo>): string =>
  "memo" in intent && intent.memo?.type === "string" && intent.memo.kind === "comment"
    ? intent.memo.value
    : "";

// A raw address carries no flag, and the legacy bridge bounces then.
export const parseRecipient = (recipient: string): TonRecipient => ({
  address: Address.parse(recipient),
  bounce: !Address.isFriendly(recipient) || Address.parseFriendly(recipient).isBounceable,
});

/**
 * A jetton transfer goes to the sender's jetton wallet, with 0.1 TON for its fees (the excess
 * comes back).
 */
export async function transferOrder(
  context: TonContext,
  intent: TransactionIntent<TonMemo>,
  recipient: TonRecipient,
): Promise<TonTransferOrder> {
  const seqno = Number(intent.sequence ?? (await getNextSequence(context, intent.sender)));
  const validUntil = Math.floor(Date.now() / 1000) + VALIDITY_SECONDS;
  const text = commentOf(intent);
  const useAllAmount = intent.useAllAmount === true;

  if (intent.asset.type === "native") {
    return {
      seqno,
      validUntil,
      sendMode: useAllAmount
        ? SendMode.CARRY_ALL_REMAINING_BALANCE
        : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      to: recipient.address,
      bounce: recipient.bounce,
      amount: useAllAmount ? 0n : intent.amount,
      payload: text ? comment(text) : null,
    };
  }

  const master = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (!master) throw new InvalidParameterError("A TON jetton transfer needs the jetton master");
  const [wallet] = await fetchJettonWallets(await context.config(), intent.sender, master);
  if (!wallet) {
    throw new InvalidParameterError(`${intent.sender} has no wallet for the jetton ${master}`);
  }

  return {
    seqno,
    validUntil,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    to: Address.parse(wallet.address),
    bounce: true,
    amount: toNano(TOKEN_TRANSFER_MAX_FEE),
    payload: jettonTransferPayload({
      amount: useAllAmount && intent.amount === 0n ? BigInt(wallet.balance) : intent.amount,
      destination: recipient.address,
      responseDestination: Address.parse(intent.sender),
      forwardPayload: text ? comment(text) : null,
    }),
  };
}

/** The unsigned wallet-v4 transfer body (BOC, base64): the exact cell the device signs. */
export async function craftTransaction(
  context: TonContext,
  intent: TransactionIntent<TonMemo>,
): Promise<CraftedTransaction> {
  const order = await transferOrder(context, intent, parseRecipient(intent.recipient));
  return { transaction: buildTransferBody(order).toBoc().toString("base64") };
}
