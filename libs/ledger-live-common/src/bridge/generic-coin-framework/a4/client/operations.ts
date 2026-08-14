import BigNumber from "bignumber.js";
import {
  encodeOperationId,
  encodeSubOperationId,
} from "@ledgerhq/ledger-wallet-framework/operation";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { isOperationType, isStringArray, readFamilyExtra } from "../../utils";
import type { A4OperationView } from "./types";

export function parseA4Asset(assetPath: string, owner: string): AssetInfo {
  if (assetPath === "native") {
    return { type: "native" };
  }

  const [type, second, third] = assetPath.split(".");

  if (type === "token" && second && third) {
    return { type: second, assetReference: third, assetOwner: owner };
  }

  if (second) {
    return { type, assetReference: second, assetOwner: owner };
  }

  return { type };
}

function deriveType(delta: BigNumber, ledgerOpType: string | undefined): OperationType {
  if (ledgerOpType !== undefined && isOperationType(ledgerOpType)) {
    return ledgerOpType;
  }
  if (delta.isGreaterThan(0)) {
    return "IN";
  }
  if (delta.isLessThan(0)) {
    return "OUT";
  }
  return "NONE";
}

function parseStake(raw: unknown): { address: string; amount: BigNumber } | undefined {
  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }
  const address = "address" in raw && typeof raw.address === "string" ? raw.address : "";
  const rawAmount =
    "amount" in raw &&
    (typeof raw.amount === "number" ||
      typeof raw.amount === "bigint" ||
      typeof raw.amount === "string")
      ? String(raw.amount)
      : "0";
  const amount = new BigNumber(rawAmount);
  return { address, amount: amount.isNaN() ? new BigNumber(0) : amount };
}

function parseAssetRefExtra(
  assetPath: string | undefined,
  address: string,
): { assetReference?: string; assetOwner?: string } {
  if (assetPath === undefined || assetPath === "native") {
    return {};
  }
  const asset = parseA4Asset(assetPath, address);
  return "assetReference" in asset
    ? { assetReference: asset.assetReference, assetOwner: asset.assetOwner }
    : {};
}

function buildExtra(
  details: Record<string, unknown> | undefined,
  feePayer: string | undefined,
  assetPath: string | undefined,
  address: string,
) {
  const extra: {
    assetReference?: string;
    assetOwner?: string;
    assetAmount?: string;
    assetSenders?: string[];
    assetRecipients?: string[];
    parentSenders?: string[];
    parentRecipients?: string[];
    ledgerOpType?: string;
    memo?: string;
    internal?: boolean;
    feePayer?: string;
    stake?: { address: string; amount: BigNumber };
    familyExtra?: Record<string, unknown>;
  } = {};

  if (typeof details?.ledgerOpType === "string") {
    extra.ledgerOpType = details.ledgerOpType;
  }
  if (typeof details?.assetAmount === "string") {
    extra.assetAmount = details.assetAmount;
  }
  if (isStringArray(details?.assetSenders)) {
    extra.assetSenders = details?.assetSenders;
  }
  if (isStringArray(details?.assetRecipients)) {
    extra.assetRecipients = details?.assetRecipients;
  }
  if (isStringArray(details?.parentSenders)) {
    extra.parentSenders = details?.parentSenders;
  }
  if (isStringArray(details?.parentRecipients)) {
    extra.parentRecipients = details?.parentRecipients;
  }
  if (typeof details?.memo === "string") {
    extra.memo = details.memo;
  }
  if (details?.internal === true) {
    extra.internal = true;
  }
  if (typeof feePayer === "string") {
    extra.feePayer = feePayer;
  }

  const stake = parseStake(details?.stake);
  if (stake) {
    extra.stake = stake;
  }

  const familyExtra = readFamilyExtra(details);
  if (familyExtra) {
    extra.familyExtra = familyExtra;
  }

  Object.assign(extra, parseAssetRefExtra(assetPath, address));

  return extra;
}

type MakeOp = (type: OperationType, value: BigNumber, assetPath?: string) => Operation;

function buildOpsFromParts(
  parts: NonNullable<A4OperationView["parts"]>,
  address: string,
  ledgerOpType: string | undefined,
  bnFees: BigNumber,
  failed: boolean,
  makeOp: MakeOp,
): Operation[] {
  const results: Operation[] = [];
  for (const part of parts) {
    if (part.address !== address || part.type === "event" || part.type === "fee") {
      continue;
    }
    const delta = new BigNumber(part.amount);
    const type = deriveType(delta, ledgerOpType);
    if (failed && type === "IN") {
      continue;
    }
    let value: BigNumber;
    if (failed) {
      value = bnFees;
    } else if (part.asset === "native" && delta.isNegative()) {
      value = delta.abs().plus(bnFees);
    } else {
      value = delta.abs();
    }
    results.push(makeOp(type, value, part.type === "transfer" ? part.asset : undefined));
  }
  return results;
}

function buildOpsFromAssets(
  assets: Record<string, string>,
  ledgerOpType: string | undefined,
  bnFees: BigNumber,
  failed: boolean,
  makeOp: MakeOp,
): Operation[] {
  const results: Operation[] = [];
  for (const [assetPath, deltaStr] of Object.entries(assets)) {
    const delta = new BigNumber(deltaStr);
    const type = deriveType(delta, ledgerOpType);
    if (failed && type === "IN") {
      continue;
    }
    const value = failed ? bnFees : delta.abs();
    results.push(makeOp(type, value, assetPath));
  }
  return results;
}

export function adaptA4OperationToLiveOperation(
  accountId: string,
  address: string,
  a4Op: A4OperationView,
): Operation[] {
  const details = a4Op.tx.details;
  const ledgerOpType = typeof details?.ledgerOpType === "string" ? details.ledgerOpType : undefined;

  if (ledgerOpType === "NFT_IN" || ledgerOpType === "NFT_OUT") {
    return [];
  }

  const bnFees = new BigNumber(a4Op.fees);
  const blockHash = a4Op.block?.hash ?? null;
  const blockHeight = a4Op.block?.height ?? null;
  const date = a4Op.block?.time ? new Date(a4Op.block.time) : new Date(0);
  const seq = details?.sequence;
  const txSeq =
    typeof seq === "number" || typeof seq === "bigint" || typeof seq === "string"
      ? new BigNumber(String(seq))
      : undefined;

  const parentSenders = isStringArray(details?.parentSenders) ? details?.parentSenders : undefined;
  const parentRecipients = isStringArray(details?.parentRecipients)
    ? details?.parentRecipients
    : undefined;
  const senders = parentSenders ?? a4Op.senders ?? [];
  const recipients = parentRecipients ?? a4Op.recipients ?? [];

  const typeCount = new Map<OperationType, number>();
  const makeId = (type: OperationType): string => {
    const n = typeCount.get(type) ?? 0;
    typeCount.set(type, n + 1);
    return n === 0
      ? encodeOperationId(accountId, a4Op.tx.hash, type)
      : encodeSubOperationId(accountId, a4Op.tx.hash, type, n);
  };

  const makeOp: MakeOp = (type, value, assetPath) => ({
    id: makeId(type),
    hash: a4Op.tx.hash,
    accountId,
    type,
    value,
    fee: bnFees,
    blockHash,
    blockHeight,
    senders,
    recipients,
    date,
    transactionSequenceNumber: txSeq,
    hasFailed: a4Op.failed,
    extra: buildExtra(details, a4Op.feePayer, assetPath, address),
  });

  const parts = a4Op.parts;
  if (parts?.length) {
    return buildOpsFromParts(parts, address, ledgerOpType, bnFees, a4Op.failed, makeOp);
  }

  return buildOpsFromAssets(a4Op.assets, ledgerOpType, bnFees, a4Op.failed, makeOp);
}
