import React from "react";
import { DevTools } from "@devtools/shell";
import { useDevToolsScreenViewModel } from "./useDevToolsScreenViewModel";

export default function DevToolsScreen() {
  const { config, screenOptions } = useDevToolsScreenViewModel();

  return <DevTools config={config} screenOptions={screenOptions} />;
}
