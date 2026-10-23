import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { Address, beginCell, toNano } from "@ton/core";
import { WalletContractV4 } from "@ton/ton";
import type { TonContext } from "../config";
import { TOKEN_TRANSFER_MAX_FEE, WORKCHAIN } from "../constants";
import { estimateFee } from "../network";
import type { TonMemo } from "../types";
import { type TonRecipient, parseRecipient, transferOrder } from "./craftTransaction";
import { buildTransferBody } from "./transferBody";

// Fees barely depend on the recipient, so one not typed in yet is priced as the zero address.
const recipientForEstimation = (recipient: string): TonRecipient => {
  try {
    return parseRecipient(recipient);
  } catch {
    return { address: new Address(WORKCHAIN, Buffer.alloc(32)), bounce: true };
  }
};

/**
 * A jetton transfer is charged the 0.1 TON it attaches, as on the legacy bridge, though the excess
 * comes back.
 */
export async function estimateFees(
  context: TonContext,
  intent: TransactionIntent<TonMemo>,
): Promise<FeeEstimation> {
  if (intent.asset.type !== "native") return { value: toNano(TOKEN_TRANSFER_MAX_FEE) };

  const order = await transferOrder(context, intent, recipientForEstimation(intent.recipient));
  const body = beginCell()
    .storeBuffer(Buffer.alloc(64))
    .storeSlice(buildTransferBody(order).beginParse())
    .endCell();
  const init = order.seqno === 0 ? walletInit(intent.senderPublicKey) : undefined;

  const fee = await estimateFee(await context.config(), {
    address: intent.sender,
    body: body.toBoc().toString("base64"),
    initCode: init?.code.toBoc().toString("base64"),
    initData: init?.data.toBoc().toString("base64"),
  });
  return { value: BigInt(fee.in_fwd_fee + fee.storage_fee + fee.gas_fee + fee.fwd_fee) };
}

function walletInit(publicKeyHex: string | undefined) {
  const publicKey = Buffer.from(publicKeyHex ?? "", "hex");
  if (publicKey.length !== 32) {
    throw new InvalidParameterError("Pricing a TON wallet's first transfer needs its public key");
  }
  return WalletContractV4.create({ workchain: WORKCHAIN, publicKey }).init;
}
