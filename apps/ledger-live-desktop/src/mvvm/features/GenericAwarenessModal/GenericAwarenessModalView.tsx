import React, { useEffect } from "react";
import { useSelector } from "LLD/hooks/redux";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { selectGenericAwarenessModalHasStoredContentCards } from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { GenericAwarenessModalViewProps } from "./hooks/useGenericAwarenessModalViewModel";
import useGenericAwarenessModalFeatureIntroViewModel, {
  type GenericAwarenessModalFeatureIntroViewModel,
} from "./hooks/useGenericAwarenessModalFeatureIntroViewModel";
import useGenericAwarenessModalCarouselViewModel, {
  type GenericAwarenessModalCarouselViewModel,
} from "./hooks/useGenericAwarenessModalCarouselViewModel";
import CarouselContent from "./components/CarouselContent";
import FeatureIntroContent from "./components/FeatureIntroContent";

function renderModalContent(
  contentCard: GenericAwarenessModalContentCard,
  carouselViewModel: GenericAwarenessModalCarouselViewModel,
  featureIntroViewModel: GenericAwarenessModalFeatureIntroViewModel,
) {
  switch (contentCard.layout) {
    case GenericAwarenessModalLayout.Carousel:
      return <CarouselContent {...carouselViewModel} />;
    case GenericAwarenessModalLayout.FeatureIntro:
      return <FeatureIntroContent {...featureIntroViewModel} />;
    default:
      return null;
  }
}

const GenericAwarenessModalView = ({
  isOpen,
  onClose,
  contentCard,
}: GenericAwarenessModalViewProps) => {
  const hasStoredContentCards = useSelector(selectGenericAwarenessModalHasStoredContentCards);
  const carouselViewModel = useGenericAwarenessModalCarouselViewModel(contentCard);
  const featureIntroViewModel = useGenericAwarenessModalFeatureIntroViewModel(contentCard);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  useEffect(() => {
    if (isOpen && !contentCard && hasStoredContentCards) {
      onClose();
    }
  }, [hasStoredContentCards, isOpen, contentCard, onClose]);

  if (!contentCard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] rounded-xl"
        aria-describedby={undefined}
        data-testid="generic-awareness-modal"
        data-campaign-id={contentCard.id}
      >
        <DialogHeader density="expanded" onClose={onClose} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden">
          {renderModalContent(contentCard, carouselViewModel, featureIntroViewModel)}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default GenericAwarenessModalView;
