import React from "react";
import { HistoryExportDialog } from "@features/flow-history-export/web";
import { useHistoryExportPort } from "../hooks/useHistoryExportPort";

type Props = Readonly<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}>;

function OpenHistoryExportDialog({ onOpenChange }: Pick<Props, "onOpenChange">) {
  const port = useHistoryExportPort();
  return <HistoryExportDialog open onOpenChange={onOpenChange} port={port} />;
}

/** Mounts the export port only while the dialog is open: it subscribes to the bridge sync state. */
export function HistoryExport({ isOpen, onOpenChange }: Props) {
  return isOpen ? <OpenHistoryExportDialog onOpenChange={onOpenChange} /> : null;
}
