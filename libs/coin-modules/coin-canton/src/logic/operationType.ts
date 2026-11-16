import type { OperationTypeView, OperationType as GatewayOperationType } from "../types/gateway";

export type CantonOperationType =
  | "IN"
  | "OUT"
  | "FEES"
  | "TRANSFER_PROPOSAL"
  | "TRANSFER_REJECTED"
  | "TRANSFER_WITHDRAWN"
  | "PRE_APPROVAL"
  | "UNKNOWN";

const OPERATION_TYPE_MAP: Readonly<Partial<Record<GatewayOperationType, CantonOperationType>>> = {
  "transfer-proposal": "TRANSFER_PROPOSAL",
  "transfer-rejected": "TRANSFER_REJECTED",
  "transfer-withdrawn": "TRANSFER_WITHDRAWN",
} as const;

const TX_TYPE_MAP: Readonly<Partial<Record<OperationTypeView, CantonOperationType>>> = {
  Receive: "IN",
  Initialize: "PRE_APPROVAL",
} as const;

function getSendOperationType(
  transferValue: string,
  senders: string[],
  partyId: string,
): CantonOperationType {
  if (transferValue === "0") {
    return "FEES";
  }
  return senders.includes(partyId) ? "OUT" : "IN";
}

function isGatewayOperationType(value: string | undefined): value is GatewayOperationType {
  return value !== undefined && Object.prototype.hasOwnProperty.call(OPERATION_TYPE_MAP, value);
}

function getOperationTypeFromDetails(
  operationType: string | undefined,
): CantonOperationType | null {
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
): CantonOperationType {
  const detailsType = getOperationTypeFromDetails(operationType);
  if (detailsType) {
    return detailsType;
  }

  if (txType === "Send") {
    return getSendOperationType(transferValue, senders, partyId);
  }

  return TX_TYPE_MAP[txType] ?? "UNKNOWN";
}
