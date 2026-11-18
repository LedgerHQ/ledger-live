import type { HistoryExportPort } from "../../model/ports";

export type HistoryExportDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  port: HistoryExportPort;
}>;
