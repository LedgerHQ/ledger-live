import React, { useCallback, useEffect, useRef } from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { FeatureTourViewModel } from "./useFeatureTourViewModel";

type FeatureTourViewProps = FeatureTourViewModel;

export function FeatureTourView({
  isVisible,
  title,
  description,
  rows,
  ctaLabel,
  onShown,
  onDismiss,
}: FeatureTourViewProps) {
  const dismissed = useRef(false);

  useEffect(() => {
    if (isVisible) {
      onShown();
    }
  }, [isVisible, onShown]);

  const handleDismiss = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    onDismiss();
  }, [onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) {
          handleDismiss();
        }
      }}
    >
      <DialogContent>
        <DialogHeader title={title} description={description} onClose={handleDismiss} />
        <DialogBody>
          <div className="flex flex-col gap-8">
            {rows.map(row => (
              <div key={row.key} className="flex flex-col gap-4">
                <span className="body-2-semi-bold text-base">{row.title}</span>
                <span className="body-3 text-muted">{row.description}</span>
              </div>
            ))}
          </div>
          <Button appearance="base" size="lg" onClick={handleDismiss}>
            {ctaLabel}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
