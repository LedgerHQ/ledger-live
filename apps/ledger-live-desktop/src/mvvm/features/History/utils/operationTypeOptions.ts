import type { OperationType } from "@ledgerhq/types-live";
import {
  ArrowUp,
  ArrowDown,
  Snow,
  StarFill,
  Invoice,
  PenEditWriting,
  Unlink,
} from "@ledgerhq/lumen-ui-react/symbols";

export const ALL_TYPES_VALUE = "ALL";

export type HistoryTypeFilter = OperationType | typeof ALL_TYPES_VALUE;

type IconComponent = typeof ArrowUp; // Using one of the icons as a type reference for the icon components

export type OperationTypeOption = {
  value: HistoryTypeFilter;
  label: string;
  icon?: IconComponent;
};

const SUPPORTED_OPERATION_TYPE_OPTIONS: OperationTypeOption[] = [
  { value: ALL_TYPES_VALUE, label: "Types" },
  { value: "OUT", label: "Sent", icon: ArrowUp },
  { value: "IN", label: "Received", icon: ArrowDown },
  { value: "FEES", label: "Fees", icon: Invoice },
  { value: "REWARD", label: "Claimed Rewards", icon: StarFill },
  { value: "DELEGATE", label: "Delegated", icon: ArrowDown },
  { value: "WITHDRAW", label: "Withdraw", icon: PenEditWriting },
  { value: "APPROVE", label: "Approval", icon: Snow },
  { value: "UNDELEGATE", label: "Undelegated", icon: Unlink },
];

export function getOperationTypeOptions(): OperationTypeOption[] {
  return SUPPORTED_OPERATION_TYPE_OPTIONS;
}
