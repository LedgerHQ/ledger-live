import React from "react";
import { DevTools } from "@devtools/shell";
import { AccountRedactionProvider } from "@devtools/bindings";
import { TransportPanel } from "@devtools/transport-panel";
import { IntentWalletSyncExecutor } from "../../IntentWalletSync/IntentWalletSyncExecutor";
import { AccountDiscoveryExecutor } from "../../AccountDiscovery/AccountDiscoveryExecutor";
import { useDevToolsScreenViewModel } from "./useDevToolsScreenViewModel";
import { accountRedaction } from "./accountRedaction";

type Props = Readonly<{
  onClose?: () => void;
}>;

export default function DevToolsScreen(props: Props) {
  return (
    <AccountRedactionProvider value={accountRedaction}>
      <DevToolsScreenContent {...props} />
    </AccountRedactionProvider>
  );
}

function DevToolsScreenContent({ onClose: onCloseOverride }: Props) {
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
    onAccountDiscoveryRunFailed,
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
        onError={onAccountDiscoveryRunFailed}
      />
    </div>
  );
}
