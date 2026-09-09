import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { Slides } from "LLD/components/Slides";
import { QuarterlyTourSlideItem } from "./QuarterlyTourSlideItem";
import { QuarterlyTourFooterButton } from "./QuarterlyTourFooterButton";
import { QuarterlyTourProgressIndicator } from "./QuarterlyTourProgressIndicator";
import type { QuarterlyTourConfig } from "./types";

interface QuarterlyTourDialogProps {
  readonly tour: QuarterlyTourConfig;
  readonly isOpen: boolean;
  readonly onHeaderClose: () => void;
  readonly onDismiss: () => void;
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  readonly onComplete: () => void;
  readonly onSlideChange?: (index: number) => void;
}

export const QuarterlyTourDialog = ({
  tour,
  isOpen,
  onHeaderClose,
  onDismiss,
  onContinueClick,
  onComplete,
  onSlideChange,
}: QuarterlyTourDialogProps) => {
  const slideItems = useMemo(
    () =>
      tour.slides.map((slide, index) => (
        <Slides.Content.Item
          key={`${tour.id}-${slide.id}`}
          data-testid={`${tour.id}-slide-${index}`}
        >
          <QuarterlyTourSlideItem slideIndex={index} slides={tour.slides} />
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
              <QuarterlyTourProgressIndicator />
            </Slides.ProgressIndicator>

            <Slides.Footer>
              <QuarterlyTourFooterButton
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
