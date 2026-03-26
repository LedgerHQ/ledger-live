import React, { useState, useCallback } from "react";
import { Dialog, DialogTrigger } from "@ledgerhq/lumen-ui-react";
import { useHistoryExportDialogViewModel } from "./useHistoryExportDialogViewModel";
import { HistoryExportDialogView } from "./HistoryExportDialogView";

function HistoryExportDialogContent({ onResult }: { onResult: () => void }) {
  const vm = useHistoryExportDialogViewModel({ onResult });
  return <HistoryExportDialogView {...vm} />;
}

export function HistoryExportDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dialogHeight, setDialogHeight] = useState<"fixed" | "hug">("fixed");

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setDialogHeight("fixed");
  }, []);

  const handleResult = useCallback(() => setDialogHeight("hug"), []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} height={dialogHeight}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {open ? <HistoryExportDialogContent onResult={handleResult} /> : null}
    </Dialog>
  );
}
