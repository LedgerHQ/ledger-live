import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { GenericAwarenessModalViewProps } from "./hooks/useGenericAwarenessModalViewModel";
import useGenericAwarenessModalFeatureIntroViewModel from "./hooks/useGenericAwarenessModalFeatureIntroViewModel";
import useGenericAwarenessModalCarouselViewModel from "./hooks/useGenericAwarenessModalCarouselViewModel";
import CarouselContent from "./components/CarouselContent";
import FeatureIntroContent from "./components/FeatureIntroContent";

const GenericAwarenessModalView = ({
  isOpen,
  onClose,
  campaignId,
  contentVariant,
}: GenericAwarenessModalViewProps) => {
  const featureIntroViewModel = useGenericAwarenessModalFeatureIntroViewModel();
  const carouselViewModel = useGenericAwarenessModalCarouselViewModel();

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const isCarousel = contentVariant === "carousel";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] rounded-xl"
        aria-describedby={undefined}
        data-testid="generic-awareness-modal"
        data-campaign-id={campaignId ?? undefined}
      >
        <DialogHeader density="expanded" onClose={onClose} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden">
          {isCarousel ? (
            <CarouselContent {...carouselViewModel} />
          ) : (
            <FeatureIntroContent {...featureIntroViewModel} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default GenericAwarenessModalView;
