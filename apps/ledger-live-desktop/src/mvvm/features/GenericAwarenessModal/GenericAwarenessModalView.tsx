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
import useGenericAwarenessModalPromptViewModel, {
  type GenericAwarenessModalPromptViewModel,
} from "./hooks/useGenericAwarenessModalPromptViewModel";
import CarouselContent from "./components/CarouselContent";
import FeatureIntroContent from "./components/FeatureIntroContent";
import PromptContent from "./components/PromptContent";

type LayoutChromeHandlers = Pick<
  | GenericAwarenessModalCarouselViewModel
  | GenericAwarenessModalFeatureIntroViewModel
  | GenericAwarenessModalPromptViewModel,
  "onDismiss" | "onHeaderClose"
>;

const getLayoutViewModel = (
  layout: GenericAwarenessModalContentCard["layout"],
  carouselViewModel: GenericAwarenessModalCarouselViewModel,
  featureIntroViewModel: GenericAwarenessModalFeatureIntroViewModel,
  promptViewModel: GenericAwarenessModalPromptViewModel,
): LayoutChromeHandlers | undefined => {
  switch (layout) {
    case GenericAwarenessModalLayout.Carousel:
      return carouselViewModel;
    case GenericAwarenessModalLayout.FeatureIntro:
      return featureIntroViewModel;
    case GenericAwarenessModalLayout.Prompt:
      return promptViewModel;
    default:
      return undefined;
  }
};

function renderModalContent(
  contentCard: GenericAwarenessModalContentCard,
  carouselViewModel: GenericAwarenessModalCarouselViewModel,
  featureIntroViewModel: GenericAwarenessModalFeatureIntroViewModel,
  promptViewModel: GenericAwarenessModalPromptViewModel,
) {
  switch (contentCard.layout) {
    case GenericAwarenessModalLayout.Carousel:
      return <CarouselContent {...carouselViewModel} />;
    case GenericAwarenessModalLayout.FeatureIntro:
      return <FeatureIntroContent {...featureIntroViewModel} />;
    case GenericAwarenessModalLayout.Prompt:
      return <PromptContent {...promptViewModel} />;
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
  const promptViewModel = useGenericAwarenessModalPromptViewModel(contentCard, isOpen);

  useEffect(() => {
    if (isOpen && !contentCard && hasStoredContentCards) {
      onClose();
    }
  }, [hasStoredContentCards, isOpen, contentCard, onClose]);

  if (!contentCard) {
    return null;
  }

  const layoutViewModel = getLayoutViewModel(
    contentCard.layout,
    carouselViewModel,
    featureIntroViewModel,
    promptViewModel,
  );

  const onDismiss = layoutViewModel?.onDismiss ?? onClose;
  const onHeaderClose = layoutViewModel?.onHeaderClose ?? onClose;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[90vh] rounded-xl"
        aria-describedby={undefined}
        data-testid="generic-awareness-modal"
        data-campaign-id={contentCard.id}
        onPointerDownOutside={onDismiss}
        onEscapeKeyDown={onDismiss}
      >
        <DialogHeader density="expanded" onClose={onHeaderClose} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden">
          {renderModalContent(
            contentCard,
            carouselViewModel,
            featureIntroViewModel,
            promptViewModel,
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default GenericAwarenessModalView;
