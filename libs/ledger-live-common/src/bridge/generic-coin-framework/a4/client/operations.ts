import BigNumber from "bignumber.js";
import {
  encodeOperationId,
  encodeSubOperationId,
} from "@ledgerhq/ledger-wallet-framework/operation";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { isOperationType } from "../../utils";
import type { A4OperationView, A4OperationPart, A4OperationTransfer } from "./types";
import { A4Client } from "./index";
import { normalizeAccountKey, checksumAccountKey } from "./utils";

export function parseA4Asset(assetPath: string, owner: string): AssetInfo {
  if (assetPath === "native") {
    return { type: "native" };
  }

  const [type, second, third] = assetPath.split(".");

  if (type === "token" && second && third) {
    return { type: second, assetReference: checksumAccountKey(third), assetOwner: owner };
  }

  if (second) {
    return { type, assetReference: checksumAccountKey(second), assetOwner: owner };
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

function parseAssetRef(
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

function extractEventContractAddress(parts: A4OperationPart[] | undefined): string | undefined {
  let fallback: string | undefined;
  for (const p of parts ?? []) {
    if (p.type !== "event") continue;
    const d = p.eventData;
    if (!d || typeof d !== "object") continue;
    if (!("contractAddress" in d) || typeof d.contractAddress !== "string") continue;
    const addr = d.contractAddress;
    if ("contractPayload" in d && typeof d.contractPayload === "string") {
      const hex = d.contractPayload.startsWith("0x")
        ? d.contractPayload.slice(2)
        : d.contractPayload;
      if (hex.slice(0, 8).toLowerCase() === ERC20_TRANSFER_SELECTOR) {
        return checksumAccountKey(addr);
      }
    }
    if (fallback === undefined) fallback = checksumAccountKey(addr);
  }
  return fallback;
}

type ERC20Transfer = { contractAddress: string; from: string; to: string; value: string };

const ERC20_TRANSFER_SELECTOR = "a9059cbb";

function decodeERC20TransferPayload(
  payload: string,
  caller: string,
): { from: string; to: string; value: string } | undefined {
  const hex = payload.startsWith("0x") ? payload.slice(2) : payload;
  if (hex.length < 136) return undefined;
  if (hex.slice(0, 8).toLowerCase() !== ERC20_TRANSFER_SELECTOR) return undefined;
  const to = "0x" + hex.slice(32, 72);
  const value = new BigNumber("0x" + hex.slice(72, 136)).toFixed(0);
  return { from: caller, to, value };
}

function parseERC20TransferData(eventData: unknown, caller: string): ERC20Transfer | undefined {
  if (!eventData || typeof eventData !== "object") return undefined;
  if (!("contractAddress" in eventData) || typeof eventData.contractAddress !== "string")
    return undefined;
  const contractAddress = eventData.contractAddress;
  const from =
    "from" in eventData && typeof eventData.from === "string" ? eventData.from : undefined;
  const to = "to" in eventData && typeof eventData.to === "string" ? eventData.to : undefined;
  const value =
    "value" in eventData &&
    (typeof eventData.value === "string" || typeof eventData.value === "number")
      ? String(eventData.value)
      : undefined;
  if (from && to && value) return { contractAddress, from, to, value };
  const payload =
    "contractPayload" in eventData && typeof eventData.contractPayload === "string"
      ? eventData.contractPayload
      : undefined;
  if (!payload) return undefined;
  const decoded = decodeERC20TransferPayload(payload, caller);
  if (!decoded) return undefined;
  return { contractAddress, ...decoded };
}

function resolveSendersRecipients(
  type: OperationType,
  checksummedAddress: string,
  peer: string | undefined,
  txSenders: string[],
  txRecipients: string[],
  checksummedFeePayer: string | undefined,
): { opSenders: string[]; opRecipients: string[] } {
  let opSenders: string[];
  let opRecipients: string[];

  if (type === "IN") {
    const normalizedAccount = normalizeAccountKey(checksummedAddress);
    const txSenderIsJustAccount =
      !peer && txSenders.length === 1 && normalizeAccountKey(txSenders[0]) === normalizedAccount;
    const useFeePayer =
      txSenderIsJustAccount &&
      checksummedFeePayer &&
      normalizeAccountKey(checksummedFeePayer) !== normalizedAccount;
    opSenders = peer ? [peer] : useFeePayer ? [checksummedFeePayer] : txSenders;
    opRecipients = [checksummedAddress];
  } else if (type === "OUT") {
    opSenders = [checksummedAddress];
    opRecipients = peer ? [peer] : txRecipients;
  } else {
    const normalizedAccount = normalizeAccountKey(checksummedAddress);
    const useFeePayer =
      checksummedFeePayer && normalizeAccountKey(checksummedFeePayer) !== normalizedAccount;
    opSenders = useFeePayer ? [checksummedFeePayer] : txSenders;
    opRecipients = txRecipients;
  }

  return {
    opSenders,
    opRecipients: opRecipients.length > 0 ? opRecipients : opSenders,
  };
}

type MakeOp = (
  type: OperationType,
  value: BigNumber,
  assetPath: string | undefined,
  opSenders: string[],
  opRecipients: string[],
) => Operation;

function buildOpsFromParts(
  parts: A4OperationPart[],
  address: string,
  txSenders: string[],
  txRecipients: string[],
  checksummedFeePayer: string | undefined,
  ledgerOpType: string | undefined,
  bnFees: BigNumber,
  failed: boolean,
  makeOp: MakeOp,
): Operation[] {
  const normalizedAddress = normalizeAccountKey(address);
  const results: Operation[] = [];
  for (const part of parts) {
    if (
      normalizeAccountKey(part.address) !== normalizedAddress ||
      part.type === "event" ||
      part.type === "fee" ||
      (part.type === "transfer" && part.asset !== "native")
    ) {
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

    const peer = part.type === "transfer" && part.peer ? checksumAccountKey(part.peer) : undefined;
    const { opSenders, opRecipients } = resolveSendersRecipients(
      type,
      address,
      peer,
      txSenders,
      txRecipients,
      checksummedFeePayer,
    );

    const assetPath = part.type === "transfer" ? part.asset : undefined;
    results.push(makeOp(type, value, assetPath, opSenders, opRecipients));
  }
  return results;
}

function buildOpsFromAssets(
  assets: Record<string, string>,
  address: string,
  txSenders: string[],
  txRecipients: string[],
  checksummedFeePayer: string | undefined,
  ledgerOpType: string | undefined,
  bnFees: BigNumber,
  failed: boolean,
  makeOp: MakeOp,
): Operation[] {
  const results: Operation[] = [];
  for (const [assetPath, deltaStr] of Object.entries(assets)) {
    if (assetPath !== "native") continue;
    const delta = new BigNumber(deltaStr);
    const type = deriveType(delta, ledgerOpType);
    if (failed && type === "IN") {
      continue;
    }
    const value = failed ? bnFees : delta.abs();
    const { opSenders, opRecipients } = resolveSendersRecipients(
      type,
      address,
      undefined,
      txSenders,
      txRecipients,
      checksummedFeePayer,
    );
    results.push(makeOp(type, value, assetPath, opSenders, opRecipients));
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

  const checksummedAddress = checksumAccountKey(address);
  const checksummedFeePayer = a4Op.feePayer ? checksumAccountKey(a4Op.feePayer) : undefined;
  const txSenders = (a4Op.senders ?? []).map(checksumAccountKey);
  const txRecipients = (a4Op.recipients ?? []).map(checksumAccountKey);

  const typeCount = new Map<OperationType, number>();
  const makeId = (type: OperationType): string => {
    const n = typeCount.get(type) ?? 0;
    typeCount.set(type, n + 1);
    return n === 0
      ? encodeOperationId(accountId, a4Op.tx.hash, type)
      : encodeSubOperationId(accountId, a4Op.tx.hash, type, n);
  };

  const makeOp: MakeOp = (type, value, assetPath, opSenders, opRecipients) => {
    const extra: {
      feePayer?: string;
      assetReference?: string;
      assetOwner?: string;
      ledgerOpType: string;
    } = { ledgerOpType: ledgerOpType ?? type };
    if (checksummedFeePayer) {
      extra.feePayer = checksummedFeePayer;
    }
    Object.assign(extra, parseAssetRef(assetPath, address));
    return {
      id: makeId(type),
      hash: a4Op.tx.hash,
      accountId,
      type,
      value,
      fee: bnFees,
      blockHash,
      blockHeight,
      senders: opSenders,
      recipients: opRecipients,
      date,
      transactionSequenceNumber: txSeq,
      hasFailed: a4Op.failed,
      extra,
    };
  };

  const parts = a4Op.parts;
  const nativeOps = buildNativeOps(
    parts,
    a4Op.assets,
    address,
    txSenders,
    txRecipients,
    checksummedFeePayer,
    ledgerOpType,
    bnFees,
    a4Op.failed,
    makeOp,
  );

  const tokenOps = buildTokenOpsFromEvents(
    accountId,
    checksummedAddress,
    a4Op,
    bnFees,
    blockHash,
    blockHeight,
    date,
    txSeq,
    checksummedFeePayer,
    makeId,
  );

  return [...nativeOps, ...tokenOps];
}

function buildNativeOps(
  parts: A4OperationPart[] | undefined,
  assets: Record<string, string>,
  address: string,
  txSenders: string[],
  txRecipients: string[],
  checksummedFeePayer: string | undefined,
  ledgerOpType: string | undefined,
  bnFees: BigNumber,
  failed: boolean,
  makeOp: MakeOp,
): Operation[] {
  if (parts?.length) {
    const fromParts = buildOpsFromParts(
      parts,
      address,
      txSenders,
      txRecipients,
      checksummedFeePayer,
      ledgerOpType,
      bnFees,
      failed,
      makeOp,
    );
    if (fromParts.length > 0) {
      return fromParts;
    }
  }

  const fromAssets = buildOpsFromAssets(
    assets,
    address,
    txSenders,
    txRecipients,
    checksummedFeePayer,
    ledgerOpType,
    bnFees,
    failed,
    makeOp,
  );
  if (fromAssets.length > 0) {
    const nativeDelta = assets["native"];
    const nativeDeltaIsFee =
      nativeDelta !== undefined && new BigNumber(nativeDelta).plus(bnFees).isZero();
    if (nativeDeltaIsFee) {
      const nonNativeTransferPart =
        parts?.find(
          (p): p is A4OperationTransfer =>
            p.type === "transfer" && p.asset !== "native" && new BigNumber(p.amount).isNegative(),
        ) ??
        parts?.find((p): p is A4OperationTransfer => p.type === "transfer" && p.asset !== "native");
      const firstNonNativeAssetKey =
        Object.entries(assets).find(
          ([k, v]) => k !== "native" && new BigNumber(v).isNegative(),
        )?.[0] ?? Object.keys(assets).find(k => k !== "native");
      const feesContractAddress = nonNativeTransferPart
        ? parseAssetRef(nonNativeTransferPart.asset, address).assetReference
        : (extractEventContractAddress(parts) ??
          (firstNonNativeAssetKey
            ? parseAssetRef(firstNonNativeAssetKey, address).assetReference
            : undefined));
      const feesRecipients = feesContractAddress ? [feesContractAddress] : txRecipients;
      const { opSenders, opRecipients } = resolveSendersRecipients(
        "FEES",
        address,
        undefined,
        [address],
        feesRecipients,
        checksummedFeePayer,
      );
      return [makeOp("FEES", bnFees, "native", opSenders, opRecipients)];
    }
    return fromAssets;
  }

  const firstNonNativeKey = Object.keys(assets).find(k => k !== "native");
  if (!firstNonNativeKey) {
    return [];
  }

  const contractAddress = parseAssetRef(firstNonNativeKey, address).assetReference;
  const noneRecipients = contractAddress ? [contractAddress] : txRecipients;
  const { opSenders, opRecipients } = resolveSendersRecipients(
    "NONE",
    address,
    undefined,
    txSenders,
    noneRecipients,
    checksummedFeePayer,
  );
  return [makeOp("NONE", new BigNumber(0), undefined, opSenders, opRecipients)];
}

function buildTokenOpsFromEvents(
  accountId: string,
  checksummedAddress: string,
  a4Op: A4OperationView,
  bnFees: BigNumber,
  blockHash: string | null,
  blockHeight: number | null,
  date: Date,
  txSeq: BigNumber | undefined,
  checksummedFeePayer: string | undefined,
  makeId: (type: OperationType) => string,
): Operation[] {
  const parts = a4Op.parts;
  if (!parts) return [];

  const normalizedAddress = normalizeAccountKey(checksummedAddress);
  const tokenOps: Operation[] = [];

  for (const part of parts) {
    if (part.type !== "event") continue;
    const transfer = parseERC20TransferData(part.eventData, checksummedAddress);
    if (!transfer) continue;

    const normalizedFrom = normalizeAccountKey(transfer.from);
    const normalizedTo = normalizeAccountKey(transfer.to);
    const isFrom = normalizedFrom === normalizedAddress;
    const isTo = normalizedTo === normalizedAddress;
    if (!isFrom && !isTo) continue;

    const checksummedContract = checksumAccountKey(transfer.contractAddress);
    const checksummedFrom = checksumAccountKey(transfer.from);
    const checksummedTo = checksumAccountKey(transfer.to);
    const tokenValue = new BigNumber(transfer.value);
    const tokenExtra = {
      assetReference: checksummedContract,
      assetOwner: checksummedAddress,
      assetAmount: transfer.value,
      assetSenders: [checksummedFrom],
      assetRecipients: [checksummedTo],
      ...(checksummedFeePayer ? { feePayer: checksummedFeePayer } : {}),
    };

    if (isTo) {
      tokenOps.push({
        id: makeId("IN"),
        hash: a4Op.tx.hash,
        accountId,
        type: "IN",
        value: tokenValue,
        fee: bnFees,
        blockHash,
        blockHeight,
        senders: [checksummedFrom],
        recipients: [checksummedTo],
        date,
        transactionSequenceNumber: txSeq,
        hasFailed: a4Op.failed,
        extra: { ...tokenExtra, ledgerOpType: "IN" },
      });
    }
    if (isFrom) {
      tokenOps.push({
        id: makeId("OUT"),
        hash: a4Op.tx.hash,
        accountId,
        type: "OUT",
        value: tokenValue,
        fee: bnFees,
        blockHash,
        blockHeight,
        senders: [checksummedFrom],
        recipients: [checksummedTo],
        date,
        transactionSequenceNumber: txSeq,
        hasFailed: a4Op.failed,
        extra: { ...tokenExtra, ledgerOpType: "OUT" },
      });
    }
  }
  return tokenOps;
}

export async function fetchA4Operations(
  client: A4Client,
  a4AccountId: string,
  liveAccountId: string,
  address: string,
  minHeight: number,
): Promise<Operation[]> {
  const result: Operation[] = [];
  let token: string | undefined;
  do {
    const { data } = await client.listOperations(a4AccountId, {
      blocks: [minHeight, "latest"],
      order: "DESC",
      token,
    });
    for (const a4Op of data.items) {
      result.push(...adaptA4OperationToLiveOperation(liveAccountId, address, a4Op));
    }
    token = data.nextToken;
  } while (token);
  return result;
}
