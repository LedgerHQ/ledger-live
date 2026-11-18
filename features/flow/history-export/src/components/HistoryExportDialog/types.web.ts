import type { HistoryExportPort } from "../../model/ports";

export type HistoryExportDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  port: HistoryExportPort;
}>;
