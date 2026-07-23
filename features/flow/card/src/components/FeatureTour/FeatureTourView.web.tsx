import React, { useCallback, useEffect, useRef } from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { Chart2, CreditCard, Globe } from "@ledgerhq/lumen-ui-react/symbols";
import heroImage from "./payTabTour.webp";
import type { FeatureTourViewModel } from "./useFeatureTourViewModel";

type FeatureTourViewProps = FeatureTourViewModel;

const ROW_ICONS = {
  global: Globe,
  volatility: Chart2,
  card: CreditCard,
} as const;

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
        <DialogHeader onClose={handleDismiss} />
        <DialogBody>
          <div className="flex flex-col gap-24">
            <img src={heroImage} alt="" className="w-full rounded-lg" />
            <div className="flex flex-col gap-8">
              <span className="heading-3-semi-bold text-base">{title}</span>
              <span className="body-3 text-muted">{description}</span>
            </div>
            <div className="flex flex-col gap-24">
              {rows.map(row => {
                const RowIcon = ROW_ICONS[row.key as keyof typeof ROW_ICONS];
                return (
                  <div key={row.key} className="flex flex-row items-center gap-16">
                    {RowIcon ? <RowIcon size={24} /> : null}
                    <div className="flex flex-col gap-4">
                      <span className="body-2-semi-bold text-base">{row.title}</span>
                      <span className="body-3 text-muted">{row.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button appearance="base" size="lg" onClick={handleDismiss}>
              {ctaLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
