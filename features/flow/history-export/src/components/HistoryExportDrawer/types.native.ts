import type { HistoryExportPort } from "../../model/ports";

export type HistoryExportDrawerProps = Readonly<{
  onClose: () => void;
  port: HistoryExportPort;
}>;
