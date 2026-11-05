import React from "react";
import { DevTools } from "@devtools/shell";
import { TransportPanel } from "@devtools/transport-panel";
import { AccountReceiveVerifyExecutor } from "../../AccountReceiveVerify/AccountReceiveVerifyExecutor";
import { useDevToolsScreenViewModel } from "./useDevToolsScreenViewModel";

type Props = {
  onClose?: () => void;
};

export default function DevToolsScreen({ onClose: onCloseOverride }: Props) {
  const { config, onClose, transport, hubUrl, setHubUrl, role, accountReceiveVerify } =
    useDevToolsScreenViewModel(onCloseOverride);

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
      {accountReceiveVerify ? (
        <AccountReceiveVerifyExecutor
          key={accountReceiveVerify.key}
          options={accountReceiveVerify.plan.options}
          input={accountReceiveVerify.plan.input}
          onOutcome={accountReceiveVerify.onOutcome}
        />
      ) : null}
    </div>
  );
}
