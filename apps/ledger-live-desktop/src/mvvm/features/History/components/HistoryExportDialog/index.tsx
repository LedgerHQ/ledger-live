import React, { useCallback, useState } from "react";
import { Dialog, DialogTrigger } from "@ledgerhq/lumen-ui-react";
import { useHistoryExportDialogViewModel } from "./useHistoryExportDialogViewModel";
import { HistoryExportDialogView } from "./HistoryExportDialogView";

function HistoryExportDialogContent({
  setDialogHeight,
}: Readonly<{ setDialogHeight: (h: "fixed" | "fit") => void }>) {
  const vm = useHistoryExportDialogViewModel({ setDialogHeight });
  return <HistoryExportDialogView {...vm} />;
}

export function HistoryExportDialog({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);
  const [dialogHeight, setDialogHeight] = useState<"fixed" | "fit">("fixed");

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setDialogHeight("fixed");
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} height={dialogHeight}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {open ? <HistoryExportDialogContent setDialogHeight={setDialogHeight} /> : null}
    </Dialog>
  );
}
