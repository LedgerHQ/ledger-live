import React from "react";
import { DevTools } from "@devtools/shell";
import { useDevToolsScreenViewModel } from "./useDevToolsScreenViewModel";

export default function DevToolsScreen() {
  const { config, onClose } = useDevToolsScreenViewModel();

  return (
    <div
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      className="rounded-md overflow-hidden"
    >
      <DevTools config={config} onClose={onClose} />
    </div>
  );
}
