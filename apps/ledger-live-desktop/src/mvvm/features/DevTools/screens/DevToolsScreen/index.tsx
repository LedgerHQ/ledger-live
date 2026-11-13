import React from "react";
import { DevTools } from "@devtools/shell";
import { TransportPanel } from "@devtools/transport-panel";
import { IntentWalletSyncExecutor } from "../../IntentWalletSync/IntentWalletSyncExecutor";
import { AccountDiscoveryExecutor } from "../../AccountDiscovery/AccountDiscoveryExecutor";
import { useDevToolsScreenViewModel } from "./useDevToolsScreenViewModel";

type Props = {
  onClose?: () => void;
};

export default function DevToolsScreen({ onClose: onCloseOverride }: Props) {
  const {
    config,
    onClose,
    transport,
    hubUrl,
    setHubUrl,
    role,
    intentWalletSyncRun,
    onIntentWalletSyncRunCancelled,
    accountDiscoveryRun,
    onAccountDiscoveryRunCancelled,
  } = useDevToolsScreenViewModel(onCloseOverride);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      className="rounded-md overflow-hidden"
    >
      <DevTools
        config={config}
        onClose={onClose}
        footer={
          <TransportPanel transport={transport} hubUrl={hubUrl} setHubUrl={setHubUrl} role={role} />
        }
      />
      <IntentWalletSyncExecutor
        run={intentWalletSyncRun}
        onUserCancel={onIntentWalletSyncRunCancelled}
      />
      <AccountDiscoveryExecutor
        run={accountDiscoveryRun}
        onUserCancel={onAccountDiscoveryRunCancelled}
      />
    </div>
  );
}
