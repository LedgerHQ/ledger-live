import React, { useCallback, useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Spot,
  Button,
} from "@ledgerhq/lumen-ui-react";
import {
  getActionDialogSnapshot,
  subscribeActionDialog,
  resolveActionDialog,
} from "../../components/WebPTXPlayer/CustomHandlers";

const SPOT_APPEARANCE = {
  info: "info",
  warning: "warning",
  success: "check",
} as const;

export function ActionDialogComponent() {
  const data = useSyncExternalStore(subscribeActionDialog, getActionDialogSnapshot);

  const isOpen = data != null;

  const dismiss = useCallback(() => {
    resolveActionDialog(false);
  }, []);

  const confirm = useCallback(() => {
    resolveActionDialog(true);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) dismiss();
    },
    [dismiss],
  );

  if (!data) return null;

  const spotAppearance = SPOT_APPEARANCE[data.icon ?? "info"] ?? "info";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-canvas rounded-2xl overflow-hidden">
        <DialogHeader appearance="compact" onClose={dismiss} className="absolute right-0 z-10" />
        <div className="relative flex flex-col items-center gap-32 overflow-hidden px-16 pb-24 pt-64">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-muted" />
          <div className="flex w-full flex-col items-center gap-24">
            <Spot appearance={spotAppearance} size={72} />
            <div className="flex flex-col items-center gap-8 text-center">
              <h3 className="heading-4-semi-bold text-base">{data.title}</h3>
              <p className="body-2 text-muted">{data.description}</p>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-16">
            <Button appearance="base" size="lg" className="w-full" onClick={confirm}>
              {data.ctaLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
