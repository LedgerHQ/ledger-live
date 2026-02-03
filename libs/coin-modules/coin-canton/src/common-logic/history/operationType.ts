import { OperationType } from "@ledgerhq/types-live";
import type { OperationTypeView, OperationType as GatewayOperationType } from "../../types/gateway";

const OPERATION_TYPE_MAP: Readonly<Partial<Record<GatewayOperationType, OperationType>>> = {
  "transfer-proposal": "TRANSFER_PROPOSAL",
  "transfer-rejected": "TRANSFER_REJECTED",
  "transfer-withdrawn": "TRANSFER_WITHDRAWN",
} as const;

const TX_TYPE_MAP: Readonly<Partial<Record<OperationTypeView, OperationType>>> = {
  Receive: "IN",
  Initialize: "PRE_APPROVAL",
} as const;

function getSendOperationType(
  transferValue: string,
  senders: string[],
  partyId: string,
): OperationType {
  if (transferValue === "0") {
    return "FEES";
  }
  return senders.includes(partyId) ? "OUT" : "IN";
}

function isGatewayOperationType(value: string | undefined): value is GatewayOperationType {
  return value !== undefined && value in OPERATION_TYPE_MAP;
}

function getOperationTypeFromDetails(operationType: string | undefined): OperationType | null {
  if (!isGatewayOperationType(operationType)) {
    return null;
  }

  const mappedType = OPERATION_TYPE_MAP[operationType];
  return mappedType ?? null;
}

export function determineOperationType(
  operationType: string | undefined,
  txType: OperationTypeView,
  transferValue: string,
  senders: string[],
  partyId: string,
): OperationType {
  const detailsType = getOperationTypeFromDetails(operationType);
  if (detailsType) {
    return detailsType;
  }

  if (txType === "Send") {
    return getSendOperationType(transferValue, senders, partyId);
  }

  return TX_TYPE_MAP[txType] ?? "UNKNOWN";
}
