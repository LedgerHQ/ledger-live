import React, { useCallback, useState } from "react";
import { Dialog, DialogTrigger } from "@ledgerhq/lumen-ui-react";
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

export function HistoryExportDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  port,
}: HistoryExportDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [dialogHeight, setDialogHeight] = useState<"fixed" | "fit">("fixed");
  const open = controlledOpen ?? uncontrolledOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
      if (!next) setDialogHeight("fixed");
    },
    [controlledOpen, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} height={dialogHeight}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      {open ? <HistoryExportDialogContent port={port} setDialogHeight={setDialogHeight} /> : null}
    </Dialog>
  );
}
