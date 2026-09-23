import React, { useCallback, useRef } from "react";
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
import { PayTrackPage } from "@features/platform-pay-analytics";
import heroImage from "./payTabTour.webp";
import {
  FEATURE_TOUR_FLOW,
  FEATURE_TOUR_PAGE,
  type FeatureTourViewModel,
} from "./useFeatureTourViewModel";

type FeatureTourViewProps = FeatureTourViewModel;

export function FeatureTourView({
  isVisible,
  title,
  description,
  rows,
  ctaLabel,
  onClose,
  onContinue,
}: FeatureTourViewProps) {
  const dismissed = useRef(false);

  const handleClose = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    onClose();
  }, [onClose]);

  const handleContinue = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    onContinue();
  }, [onContinue]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose],
  );

  if (!isVisible) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <PayTrackPage page={FEATURE_TOUR_PAGE} flow={FEATURE_TOUR_FLOW} />
      <DialogContent className="min-h-[696px]">
        <DialogHeader density="compact" onClose={handleClose} />
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
            <Button appearance="base" size="lg" className="w-full" onClick={handleContinue}>
              {ctaLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
