import React from "react";
import { QuarterlyTourDialog } from "LLD/components/QuarterlyTour";
import { Q2_TOUR_CONFIG } from "./const";

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
}: Q2TourDialogProps) => (
  <QuarterlyTourDialog
    tour={Q2_TOUR_CONFIG}
    isOpen={isOpen}
    onHeaderClose={onHeaderClose}
    onDismiss={onDismiss}
    onContinueClick={onContinueClick}
    onComplete={onComplete}
    onSlideChange={onSlideChange}
  />
);
