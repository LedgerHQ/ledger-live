import type React from "react";
import type { HistoryExportPort } from "../../model/ports";

export type HistoryExportDialogProps = Readonly<{
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  port: HistoryExportPort;
}>;
