import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { Slides } from "LLD/components/Slides";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { TourProgressIndicator } from "./components/TourProgressIndicator";
import { Q2_TOUR_SLIDE_COUNT } from "./const";

interface Q2TourDialogProps {
  readonly isOpen: boolean;
  readonly onHeaderClose: () => void;
  readonly onDismiss: () => void;
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  readonly onComplete: () => void;
  readonly onSlideChange?: (index: number) => void;
}

export const Q2TourDialog = ({
  isOpen,
  onHeaderClose,
  onDismiss,
  onContinueClick,
  onComplete,
  onSlideChange,
}: Q2TourDialogProps) => {
  const slideItems = useMemo(
    () =>
      Array.from({ length: Q2_TOUR_SLIDE_COUNT }, (_, index) => (
        <Slides.Content.Item key={`q2-tour-${index}`} data-testid={`q2-tour-slide-${index}`}>
          <SlideItem slideIndex={index} />
        </Slides.Content.Item>
      )),
    [],
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
              <TourProgressIndicator />
            </Slides.ProgressIndicator>

            <Slides.Footer>
              <SlideFooterButton onContinueClick={onContinueClick} onComplete={onComplete} />
            </Slides.Footer>
          </Slides>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
