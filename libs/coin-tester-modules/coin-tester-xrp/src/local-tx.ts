import { signAndSubmit } from "./rippled";
import type { XrplWallet } from "./signer";

// Signs outside coin-xrp so a coin-xrp bug can't hide in setup

const TF_SET_FREEZE = 0x00100000;
const TF_CLEAR_FREEZE = 0x00200000;
const TF_MPT_LOCK = 0x00000001;
const TF_MPT_UNLOCK = 0x00000002;

export const TF_SET_NO_RIPPLE = 0x00020000;
export const TF_CLEAR_NO_RIPPLE = 0x00040000;

export const ASF_DEFAULT_RIPPLE = 8;
export const ASF_ALLOW_TRUSTLINE_CLAWBACK = 16;

export const TF_MPT_CAN_LOCK = 0x00000002;
export const TF_MPT_CAN_TRANSFER = 0x00000020;
export const TF_MPT_CAN_CLAWBACK = 0x00000040;
export const TF_MPT_UNAUTHORIZE = 0x00000001;

type IouAmount = { currency: string; issuer: string; value: string };
type MptAmount = { mpt_issuance_id: string; value: string };
type IouLine = { currency: string; issuer: string };

export async function enableAccountFlag(wallet: XrplWallet, flag: number): Promise<void> {
  await signAndSubmit(wallet, { TransactionType: "AccountSet", SetFlag: flag });
}

export async function setTransferRate(issuer: XrplWallet, transferRate: number): Promise<void> {
  await signAndSubmit(issuer, { TransactionType: "AccountSet", TransferRate: transferRate });
}

export async function openTrustLine(
  holder: XrplWallet,
  { currency, issuer, limit }: IouLine & { limit: string },
): Promise<void> {
  await signAndSubmit(holder, {
    TransactionType: "TrustSet",
    LimitAmount: { currency, issuer, value: limit },
    Flags: TF_SET_NO_RIPPLE,
  });
}

/** Another wallet's Remove: limit 0 back to the default flags. The line must hold 0. */
export async function removeTrustLine(holder: XrplWallet, line: IouLine): Promise<void> {
  await openTrustLine(holder, { ...line, limit: "0" });
}

export async function issue(
  issuer: XrplWallet,
  destination: string,
  amount: IouAmount | MptAmount,
): Promise<void> {
  await signAndSubmit(issuer, {
    TransactionType: "Payment",
    Destination: destination,
    Amount: amount,
  });
}

/** Needs `ASF_ALLOW_TRUSTLINE_CLAWBACK`, set before any line to the issuer exists. */
export async function clawbackIou(
  issuer: XrplWallet,
  { holder, currency, value }: { holder: string; currency: string; value: string },
): Promise<void> {
  // In a Clawback, `Amount.issuer` is the holder
  await signAndSubmit(issuer, {
    TransactionType: "Clawback",
    Amount: { currency, issuer: holder, value },
  });
}

export async function setTrustLineFrozen(
  issuer: XrplWallet,
  { holder, currency }: { holder: string; currency: string },
  isFrozen: boolean,
): Promise<void> {
  await signAndSubmit(issuer, {
    TransactionType: "TrustSet",
    LimitAmount: { currency, issuer: holder, value: "0" },
    Flags: isFrozen ? TF_SET_FREEZE : TF_CLEAR_FREEZE,
  });
}

/** `transferFee` needs `TF_MPT_CAN_TRANSFER` in `flags`. */
export async function createMptIssuance(
  issuer: XrplWallet,
  { assetScale, flags, transferFee }: { assetScale: number; flags: number; transferFee?: number },
): Promise<string> {
  const meta = await signAndSubmit(issuer, {
    TransactionType: "MPTokenIssuanceCreate",
    AssetScale: assetScale,
    Flags: flags,
    ...(transferFee === undefined ? {} : { TransferFee: transferFee }),
  });
  const issuanceId = meta.mpt_issuance_id;
  if (typeof issuanceId !== "string") {
    throw new Error("MPTokenIssuanceCreate metadata has no mpt_issuance_id");
  }

  return issuanceId;
}

export async function authorizeMpt(holder: XrplWallet, issuanceId: string): Promise<void> {
  await signAndSubmit(holder, {
    TransactionType: "MPTokenAuthorize",
    MPTokenIssuanceID: issuanceId,
  });
}

/** Needs `TF_MPT_CAN_LOCK` on the issuance. */
export async function setMptLocked(
  issuer: XrplWallet,
  { holder, issuanceId }: { holder: string; issuanceId: string },
  isLocked: boolean,
): Promise<void> {
  await signAndSubmit(issuer, {
    TransactionType: "MPTokenIssuanceSet",
    MPTokenIssuanceID: issuanceId,
    Holder: holder,
    Flags: isLocked ? TF_MPT_LOCK : TF_MPT_UNLOCK,
  });
}

/** Needs `TF_MPT_CAN_CLAWBACK` on the issuance. `value` is in base units. */
export async function clawbackMpt(
  issuer: XrplWallet,
  { holder, issuanceId, value }: { holder: string; issuanceId: string; value: string },
): Promise<void> {
  await signAndSubmit(issuer, {
    TransactionType: "Clawback",
    Amount: { mpt_issuance_id: issuanceId, value },
    Holder: holder,
  });
}
