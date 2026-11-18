import React from "react";
import { useHistoryExportViewModel } from "../../useHistoryExportViewModel";
import { HistoryExportDrawerView } from "./HistoryExportDrawerView";
import type { HistoryExportDrawerProps } from "./types";

function OpenHistoryExportDrawer({ onClose, port }: Omit<HistoryExportDrawerProps, "isOpen">) {
  const vm = useHistoryExportViewModel({ port });
  return <HistoryExportDrawerView {...vm} onClose={onClose} />;
}

/** Mounts the view model only while open, so the accounts sync starts when the drawer opens. */
export function HistoryExportDrawer({ isOpen, onClose, port }: HistoryExportDrawerProps) {
  return isOpen ? <OpenHistoryExportDrawer onClose={onClose} port={port} /> : null;
}
