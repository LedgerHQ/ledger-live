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

type Props = Readonly<{
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export function HistoryExportDialog({ children, open: controlledOpen, onOpenChange }: Props) {
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
      {open ? <HistoryExportDialogContent setDialogHeight={setDialogHeight} /> : null}
    </Dialog>
  );
}
