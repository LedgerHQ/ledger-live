import React, { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { selectGenericAwarenessModalHasStoredContentCards } from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { AWARENESS_MODAL_DISMISS_METHOD, type AwarenessModalDismissMethod } from "./analytics/const";
import type { GenericAwarenessModalViewProps } from "./hooks/useGenericAwarenessModalViewModel";
import useGenericAwarenessModalFeatureIntroViewModel, {
  type GenericAwarenessModalFeatureIntroViewModel,
} from "./hooks/useGenericAwarenessModalFeatureIntroViewModel";
import useGenericAwarenessModalCarouselViewModel, {
  type GenericAwarenessModalCarouselViewModel,
} from "./hooks/useGenericAwarenessModalCarouselViewModel";
import CarouselContent from "./components/CarouselContent";
import FeatureIntroContent from "./components/FeatureIntroContent";

type GenericAwarenessModalLayoutHandlers = {
  readonly onDismiss: (dismissMethod: AwarenessModalDismissMethod) => void;
  readonly onHeaderClose: () => void;
};

const getLayoutHandlers = (
  layout: GenericAwarenessModalLayout,
  carouselViewModel: GenericAwarenessModalCarouselViewModel,
  featureIntroViewModel: GenericAwarenessModalFeatureIntroViewModel,
  onClose: () => void,
): GenericAwarenessModalLayoutHandlers => {
  switch (layout) {
    case GenericAwarenessModalLayout.Carousel:
      return carouselViewModel;
    case GenericAwarenessModalLayout.FeatureIntro:
      return featureIntroViewModel;
    default:
      return {
        onDismiss: () => onClose(),
        onHeaderClose: onClose,
      };
  }
};

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
  const carouselViewModel = useGenericAwarenessModalCarouselViewModel(contentCard, isOpen);
  const featureIntroViewModel = useGenericAwarenessModalFeatureIntroViewModel(contentCard, isOpen);

  const layoutHandlers = useMemo(
    () =>
      contentCard
        ? getLayoutHandlers(contentCard.layout, carouselViewModel, featureIntroViewModel, onClose)
        : { onDismiss: () => onClose(), onHeaderClose: onClose },
    [carouselViewModel, contentCard, featureIntroViewModel, onClose],
  );

  const handleBackdropDismiss = useCallback(
    () => layoutHandlers.onDismiss(AWARENESS_MODAL_DISMISS_METHOD.backdropTap),
    [layoutHandlers],
  );

  const handleEscapeDismiss = useCallback(
    () => layoutHandlers.onDismiss(AWARENESS_MODAL_DISMISS_METHOD.backButton),
    [layoutHandlers],
  );

  useEffect(() => {
    if (isOpen && !contentCard && hasStoredContentCards) {
      onClose();
    }
  }, [hasStoredContentCards, isOpen, contentCard, onClose]);

  if (!contentCard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[90vh] rounded-xl"
        aria-describedby={undefined}
        data-testid="generic-awareness-modal"
        data-campaign-id={contentCard.id}
        onPointerDownOutside={handleBackdropDismiss}
        onEscapeKeyDown={handleEscapeDismiss}
      >
        <DialogHeader density="expanded" onClose={layoutHandlers.onHeaderClose} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden">
          {renderModalContent(contentCard, carouselViewModel, featureIntroViewModel)}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default GenericAwarenessModalView;
