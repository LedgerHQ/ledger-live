import React, { useCallback, useState } from "react";
import { Dialog } from "@ledgerhq/lumen-ui-react";
import type { HistoryExportPort } from "../../model/ports";
import { useHistoryExportViewModel } from "../../useHistoryExportViewModel";
import { HistoryExportDialogView } from "./HistoryExportDialogView";
import type { HistoryExportDialogProps } from "./types";

function HistoryExportDialogContent({
  port,
  setDialogHeight,
}: Readonly<{ port: HistoryExportPort; setDialogHeight: (h: "fixed" | "fit") => void }>) {
  const vm = useHistoryExportViewModel({ port, setDialogHeight });
  return <HistoryExportDialogView {...vm} />;
}

export function HistoryExportDialog({ open, onOpenChange, port }: HistoryExportDialogProps) {
  const [dialogHeight, setDialogHeight] = useState<"fixed" | "fit">("fixed");

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) setDialogHeight("fixed");
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} height={dialogHeight}>
      {open ? <HistoryExportDialogContent port={port} setDialogHeight={setDialogHeight} /> : null}
    </Dialog>
  );
}
