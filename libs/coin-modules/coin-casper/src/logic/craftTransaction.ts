import type {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { InvalidAddress } from "@ledgerhq/ledger-wallet-framework/errors";
import { NativeTransferBuilder, PublicKey } from "casper-js-sdk";
import invariant from "invariant";
import { CASPER_DEFAULT_TTL, CASPER_MAX_TRANSFER_ID, CASPER_NETWORK } from "../constants";
import { CasperInvalidTransferId } from "../errors";
import type { CasperMemo } from "../types";
import { getEstimatedFees } from "./estimateFees";
import { getTransferIdFromMemo, toSafeNumber } from "./utils";
import { isAddressValid } from "./validateAddress";
import { validateMemo } from "./validateMemo";

export async function craftTransaction(
  transactionIntent: TransactionIntent<CasperMemo>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  invariant(transactionIntent.intentType !== "staking", "casper: staking is not supported");
  invariant(
    transactionIntent.asset.type === "native",
    "casper: asset type %s is not supported",
    transactionIntent.asset.type,
  );

  const { sender, recipient, amount, expiration } = transactionIntent;

  if (!isAddressValid(sender)) {
    throw new InvalidAddress(`Invalid sender Address ${sender}`);
  }

  if (!isAddressValid(recipient)) {
    throw new InvalidAddress(`Invalid recipient Address ${recipient}`);
  }

  const transferId = getTransferIdFromMemo(
    "memo" in transactionIntent ? transactionIntent.memo : undefined,
  );

  if (typeof transferId === "string" && transferId.length > 0 && !validateMemo(transferId)) {
    throw new CasperInvalidTransferId("", {
      maxTransferId: CASPER_MAX_TRANSFER_ID,
    });
  }

  const paymentMotes = customFees ? toSafeNumber(customFees.value) : getEstimatedFees().toNumber();

  const builder = new NativeTransferBuilder()
    .from(PublicKey.fromHex(sender))
    .target(PublicKey.fromHex(recipient))
    .amount(amount.toString())
    .chainName(CASPER_NETWORK)
    .payment(paymentMotes)
    .ttl(expiration ?? CASPER_DEFAULT_TTL);

  if (typeof transferId === "string" && transferId.length > 0) {
    // @ts-expect-error - id() expects `number` but forwards it untouched; a string keeps large ids exact
    builder.id(transferId);
  }

  const tx = builder.build();

  return { transaction: JSON.stringify(tx.toJSON()) };
}
