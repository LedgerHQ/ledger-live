import React, { useCallback, useEffect, useRef } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import heroImage from "./payTabTour.webp";
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
  const shown = useRef(false);

  useEffect(() => {
    if (isVisible && !shown.current) {
      shown.current = true;
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

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleDismiss();
      }
    },
    [handleDismiss],
  );

  if (!isVisible) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader onClose={handleDismiss} />
        <DialogBody>
          <div className="flex flex-col gap-24">
            <img src={heroImage} alt="" className="h-[180] w-full rounded-lg object-cover" />
            <div className="flex flex-col gap-8">
              <span className="heading-3-semi-bold text-base">{title}</span>
              <span className="body-3 text-muted">{description}</span>
            </div>
            <div className="flex flex-col gap-8">
              {rows.map((row, index) => {
                const RowIcon = Icons[row.icon];
                return (
                  <ListItem
                    key={`${row.icon}-${index}`}
                    data-testid={`pay-feature-tour-row-${row.icon}-${index}`}
                  >
                    <ListItemLeading>{RowIcon ? <RowIcon size={24} /> : null}</ListItemLeading>
                    <ListItemContent>
                      <ListItemTitle>{row.title}</ListItemTitle>
                      <ListItemDescription>{row.description}</ListItemDescription>
                    </ListItemContent>
                  </ListItem>
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
