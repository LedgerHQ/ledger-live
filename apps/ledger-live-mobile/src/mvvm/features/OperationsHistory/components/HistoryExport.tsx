import React from "react";
import { HistoryExportDrawer } from "@features/flow-history-export/native";
import { useHistoryExportPort } from "../hooks/useHistoryExportPort";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

function OpenHistoryExportDrawer({ onClose }: Pick<Props, "onClose">) {
  const port = useHistoryExportPort();
  return <HistoryExportDrawer onClose={onClose} port={port} />;
}

/** Mounts the export port only while the drawer is open: it subscribes to the bridge sync state. */
export function HistoryExport({ isOpen, onClose }: Props) {
  return isOpen ? <OpenHistoryExportDrawer onClose={onClose} /> : null;
}
