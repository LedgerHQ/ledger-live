import { Button } from "@ledgerhq/lumen-ui-react";
import type { WalletSyncIntentToolProps } from "../types";
import { headerCopy, logCopy, membersCopy } from "./copy";
import {
  useIntentWalletSyncViewModel,
  type IntentWalletSyncLogLine,
  type IntentWalletSyncViewModel,
} from "./useIntentWalletSyncViewModel";

const toneClass: Record<IntentWalletSyncLogLine["tone"], string> = {
  neutral: "text-base",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

function IntentWalletSync(props: WalletSyncIntentToolProps) {
  const vm = useIntentWalletSyncViewModel(props);

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="px-16 py-10 border-b border-base flex flex-col gap-8 body-3">
        <div className="flex items-center gap-8">
          <span
            className={`w-8 h-8 rounded-full inline-block ${
              vm.isRunning ? "bg-success" : "bg-muted"
            }`}
          />
          <span className="text-base">{vm.statusLabel}</span>
          <span className="ml-auto flex items-center gap-4">
            <Button
              size="sm"
              appearance="accent"
              disabled={!vm.canAddMember}
              onClick={vm.onAddMember}
            >
              {headerCopy.addMember}
            </Button>
            <Button size="sm" appearance="transparent" onClick={vm.onClearLog}>
              {headerCopy.clearLog}
            </Button>
          </span>
        </div>
        {vm.warning ? <span className="text-warning">{vm.warning}</span> : null}
      </div>

      <MembersSection vm={vm} />
      <LogSection lines={vm.logLines} />
    </div>
  );
}

function MembersSection({ vm }: Readonly<{ vm: IntentWalletSyncViewModel }>) {
  return (
    <div className="px-16 py-10 border-b border-base flex flex-col gap-8 body-3">
      <div className="flex items-center gap-8">
        <span className="body-2-semi-bold text-base">{membersCopy.title}</span>
        <Button
          className="ml-auto"
          size="sm"
          appearance="transparent"
          disabled={!vm.canRefreshMembers}
          onClick={vm.onRefreshMembers}
        >
          {membersCopy.refresh}
        </Button>
      </div>
      {vm.members === null ? <span className="text-muted">{membersCopy.notLoaded}</span> : null}
      {vm.members?.length === 0 ? <span className="text-muted">{membersCopy.empty}</span> : null}
      {vm.members?.map(member => (
        <div key={member.id} className="flex items-center gap-8">
          <div className="flex flex-col min-w-0">
            <span className="text-base truncate">{member.name}</span>
            <code className="text-muted truncate">{member.id}</code>
          </div>
          <Button
            className="ml-auto"
            size="sm"
            appearance="transparent"
            disabled={!vm.canRemoveMember}
            onClick={member.onRemove}
            aria-label={`${membersCopy.remove} ${member.name}`}
          >
            {membersCopy.remove}
          </Button>
        </div>
      ))}
    </div>
  );
}

function LogSection({ lines }: Readonly<{ lines: readonly IntentWalletSyncLogLine[] }>) {
  return (
    <div className="px-16 py-10 flex flex-col gap-4 body-3">
      <span className="body-2-semi-bold text-base">{logCopy.title}</span>
      {lines.length === 0 ? <span className="text-muted">{logCopy.empty}</span> : null}
      {lines.map(line => (
        <div key={line.key} className="flex items-baseline gap-8">
          <code className="text-muted">{line.time}</code>
          <code className="text-muted">{line.operation}</code>
          <code className={toneClass[line.tone]}>{line.jobState}</code>
          {line.detail ? <code className="text-muted truncate">{line.detail}</code> : null}
        </div>
      ))}
    </div>
  );
}

export default IntentWalletSync;
