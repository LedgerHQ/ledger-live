import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { Slides } from "LLD/components/Slides";
import { ReleaseTourSlideItem } from "./ReleaseTourSlideItem";
import { ReleaseTourFooterButton } from "./ReleaseTourFooterButton";
import { ReleaseTourProgressIndicator } from "./ReleaseTourProgressIndicator";
import type { ReleaseTourConfig } from "./types";

interface ReleaseTourDialogProps {
  readonly tour: ReleaseTourConfig;
  readonly isOpen: boolean;
  readonly onHeaderClose: () => void;
  readonly onDismiss: () => void;
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  readonly onComplete: () => void;
  readonly onSlideChange?: (index: number) => void;
}

export const ReleaseTourDialog = ({
  tour,
  isOpen,
  onHeaderClose,
  onDismiss,
  onContinueClick,
  onComplete,
  onSlideChange,
}: ReleaseTourDialogProps) => {
  const slideItems = useMemo(
    () =>
      tour.slides.map((slide, index) => (
        <Slides.Content.Item
          key={`${tour.id}-${slide.id}`}
          data-testid={`${tour.id}-slide-${index}`}
        >
          <ReleaseTourSlideItem slideIndex={index} slides={tour.slides} />
        </Slides.Content.Item>
      )),
    [tour],
  );

  const [slidesKey, setSlidesKey] = useState(0);
  const wasOpenRef = useRef(isOpen);
  useLayoutEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setSlidesKey(key => key + 1);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="flex h-screen min-h-0 flex-col"
        onPointerDownOutside={onDismiss}
        onEscapeKeyDown={onDismiss}
      >
        <DialogHeader density="compact" onClose={onHeaderClose} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden">
          <Slides key={slidesKey} initialSlideIndex={0} onSlideChange={onSlideChange}>
            <Slides.Content>{slideItems}</Slides.Content>

            <Slides.ProgressIndicator>
              <ReleaseTourProgressIndicator />
            </Slides.ProgressIndicator>

            <Slides.Footer>
              <ReleaseTourFooterButton
                slides={tour.slides}
                onContinueClick={onContinueClick}
                onComplete={onComplete}
              />
            </Slides.Footer>
          </Slides>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
