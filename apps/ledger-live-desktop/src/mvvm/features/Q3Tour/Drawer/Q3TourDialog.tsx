import React from "react";
import { ReleaseTourDialog, type ReleaseTourConfig } from "LLD/components/ReleaseTour";

interface Q3TourDialogProps {
  readonly tour: ReleaseTourConfig;
  readonly isOpen: boolean;
  readonly onHeaderClose: () => void;
  readonly onDismiss: () => void;
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  readonly onComplete: () => void;
  readonly onSlideChange?: (index: number) => void;
}

export const Q3TourDialog = ({
  tour,
  isOpen,
  onHeaderClose,
  onDismiss,
  onContinueClick,
  onComplete,
  onSlideChange,
}: Q3TourDialogProps) => (
  <ReleaseTourDialog
    tour={tour}
    isOpen={isOpen}
    onHeaderClose={onHeaderClose}
    onDismiss={onDismiss}
    onContinueClick={onContinueClick}
    onComplete={onComplete}
    onSlideChange={onSlideChange}
  />
);
