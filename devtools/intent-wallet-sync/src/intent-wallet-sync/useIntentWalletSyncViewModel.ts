import type { TrustchainMemberId } from "@features/platform-intent-wallet-sync";
import type { WalletSyncIntentToolOperation, WalletSyncIntentToolProps } from "../types";
import { headerCopy, membersCopy } from "./copy";

export interface IntentWalletSyncLogLine {
  readonly key: string;
  /** UTC time of day, `HH:MM:SS.mmm`, so two runs read the same anywhere. */
  readonly time: string;
  readonly operation: WalletSyncIntentToolOperation;
  readonly jobState: string;
  readonly detail: string | null;
  readonly tone: "neutral" | "success" | "warning" | "error";
}

export interface IntentWalletSyncMemberRow {
  readonly id: TrustchainMemberId;
  readonly name: string;
  readonly onRemove: () => void;
}

export interface IntentWalletSyncViewModel {
  readonly isRunning: boolean;
  readonly statusLabel: string;
  readonly warning: string | null;
  readonly canAddMember: boolean;
  readonly canRemoveMember: boolean;
  readonly canRefreshMembers: boolean;
  readonly members: readonly IntentWalletSyncMemberRow[] | null;
  readonly logLines: readonly IntentWalletSyncLogLine[];
  readonly onAddMember: () => void;
  readonly onRefreshMembers: () => void;
  readonly onClearLog: () => void;
}

function toneOf(jobState: string): IntentWalletSyncLogLine["tone"] {
  switch (jobState) {
    case "completed":
      return "success";
    case "device-rejected":
    case "awaiting-device-confirmation":
      return "warning";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
}

export function useIntentWalletSyncViewModel(
  props: WalletSyncIntentToolProps,
): IntentWalletSyncViewModel {
  const isRunning = props.status === "running";
  const canAddMember = !isRunning && props.hasMemberCredentials;
  const canRefreshMembers = !isRunning && props.hasMemberCredentials && props.hasTrustchain;
  const canRemoveMember = canRefreshMembers;

  let warning: string | null = null;
  if (!props.hasMemberCredentials) warning = headerCopy.noMemberCredentials;
  else if (!props.hasTrustchain) warning = headerCopy.noTrustchain;

  const members =
    props.members?.map(member => ({
      id: member.id,
      name: member.name || membersCopy.unnamed,
      onRemove: () => props.onRemoveMember(member.id),
    })) ?? null;

  const logLines = props.log.map((row, index) => ({
    key: `${row.at}-${index}`,
    time: new Date(row.at).toISOString().slice(11, 23),
    operation: row.operation,
    jobState: row.jobState,
    detail: row.detail,
    tone: toneOf(row.jobState),
  }));

  return {
    isRunning,
    statusLabel: isRunning ? headerCopy.running : headerCopy.idle,
    warning,
    canAddMember,
    canRemoveMember,
    canRefreshMembers,
    members,
    logLines,
    onAddMember: props.onAddMember,
    onRefreshMembers: props.onRefreshMembers,
    onClearLog: props.onClearLog,
  };
}
