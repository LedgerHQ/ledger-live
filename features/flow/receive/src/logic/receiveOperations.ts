import type { OperationAttributes, OperationFailureReason } from "@shared/observability-operations";

export const RECEIVE_ADDRESS_OPERATION = "receive_address";

export const RECEIVE_VERIFY_ADDRESS_OPERATION = "receive_verify_address";

export type ReceiveOperationEnding =
  | Readonly<{ type: "succeed"; attributes: OperationAttributes }>
  | Readonly<{ type: "fail"; reason: OperationFailureReason; attributes: OperationAttributes }>;
