import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/index";
import type { AssetView, OperationDetailsView, OperationView } from "../types/gateway";
import { instrumentAsset } from "./asset";
import { determineOperationType } from "./operationType";

function operationAsset(nativeInstrumentId: string, asset: AssetView | undefined): AssetInfo {
  if (!asset) return { type: "native" };
  if (asset.type === "template") {
    return {
      type: "template",
      assetReference: `${asset.packageId}:${asset.moduleName}:${asset.entityName}`,
    };
  }
  return instrumentAsset(nativeInstrumentId, asset.instrumentId, asset.instrumentAdmin);
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string");
}

function memoOf(
  details: OperationDetailsView | undefined,
  transferDetails: OperationDetailsView | undefined,
): string | undefined {
  return firstString(
    details?.metadata?.reason,
    transferDetails?.metadata?.reason,
    details?.memo,
    transferDetails?.memo,
  );
}

export function toOperation(
  nativeInstrumentId: string,
  partyId: string,
  row: OperationView,
): Operation {
  const transfer = row.transfers?.[0];
  const value = transfer?.value ?? "0";
  const senders = row.senders ?? [];
  const operationType = row.details?.operationType ?? transfer?.details?.operationType;
  const type = determineOperationType(operationType, row.type, value, senders, partyId);
  const memo = memoOf(row.details, transfer?.details);
  const [feesPayer] = senders;

  return {
    id: row.uid,
    type,
    value: BigInt(value),
    senders,
    recipients: row.recipients ?? [],
    asset: operationAsset(nativeInstrumentId, row.asset),
    details: { ledgerOpType: type, ...(memo === undefined ? {} : { memo }) },
    tx: {
      hash: row.transaction_hash,
      fees: BigInt(row.fee.value),
      ...(feesPayer === undefined ? {} : { feesPayer }),
      date: new Date(row.transaction_timestamp),
      block: {
        height: row.block.height,
        hash: row.block.hash ?? "",
        time: new Date(row.block.time),
      },
      failed: row.status === "Failed",
    },
  };
}
