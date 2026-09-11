import React from "react";
import { ReleaseTourDialog } from "LLD/components/ReleaseTour";
import { Q3_TOUR_CONFIG } from "./const";

interface Q3TourDialogProps {
  readonly isOpen: boolean;
  readonly onHeaderClose: () => void;
  readonly onDismiss: () => void;
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  readonly onComplete: () => void;
  readonly onSlideChange?: (index: number) => void;
}

export const Q3TourDialog = ({
  isOpen,
  onHeaderClose,
  onDismiss,
  onContinueClick,
  onComplete,
  onSlideChange,
}: Q3TourDialogProps) => (
  <ReleaseTourDialog
    tour={Q3_TOUR_CONFIG}
    isOpen={isOpen}
    onHeaderClose={onHeaderClose}
    onDismiss={onDismiss}
    onContinueClick={onContinueClick}
    onComplete={onComplete}
    onSlideChange={onSlideChange}
  />
);
