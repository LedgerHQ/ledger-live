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
      <DialogContent className="min-h-[696px]">
        <DialogHeader density="compact" onClose={handleDismiss} />
        <DialogBody className="flex flex-1 flex-col">
          <div className="flex min-h-[608px] w-full flex-1 flex-col justify-between gap-16">
            <div className="flex flex-col gap-16">
              <img
                src={heroImage}
                alt=""
                className="h-[192px] w-full rounded-xl object-cover"
                draggable={false}
              />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-8">
                  <span className="heading-3-semi-bold text-base">{title}</span>
                  <span className="body-2 text-muted">{description}</span>
                </div>
                <div className="flex flex-col">
                  {rows.map((row, index) => {
                    const RowIcon = Icons[row.icon];
                    return (
                      <ListItem
                        key={`${row.icon}-${index}`}
                        className="px-0"
                        data-testid={`pay-feature-tour-row-${row.icon}-${index}`}
                      >
                        <ListItemLeading className="p-0">
                          {RowIcon ? <RowIcon size={24} /> : null}
                          <ListItemContent>
                            <ListItemTitle>{row.title}</ListItemTitle>
                            <ListItemDescription>{row.description}</ListItemDescription>
                          </ListItemContent>
                        </ListItemLeading>
                      </ListItem>
                    );
                  })}
                </div>
              </div>
            </div>
            <Button appearance="base" size="lg" className="w-full" onClick={handleDismiss}>
              {ctaLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
