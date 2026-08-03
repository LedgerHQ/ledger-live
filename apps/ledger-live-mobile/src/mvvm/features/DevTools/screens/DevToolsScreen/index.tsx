import React from "react";
import { DevTools } from "@devtools/shell";
import { TransportPanel } from "@devtools/transport-panel";
import { useDevToolsScreenViewModel } from "./useDevToolsScreenViewModel";

export default function DevToolsScreen() {
  const { config, screenOptions, transport, hubUrl, setHubUrl, role } =
    useDevToolsScreenViewModel();

  return (
    <DevTools
      config={config}
      screenOptions={screenOptions}
      footer={
        <TransportPanel transport={transport} hubUrl={hubUrl} setHubUrl={setHubUrl} role={role} />
      }
    />
  );
}
