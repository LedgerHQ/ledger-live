import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { Slides } from "LLD/components/Slides";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { TourProgressIndicator } from "./components/TourProgressIndicator";

interface WalletV4TourDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onComplete: () => void;
  readonly onSlideChange?: (index: number) => void;
}

export const WalletV4TourDialog = ({
  isOpen,
  onClose,
  onComplete,
  onSlideChange,
}: WalletV4TourDialogProps) => {
  const { t } = useTranslation();

  const slides = useMemo(
    () => [
      {
        id: "portfolio" as const,
        title: t("walletV4Tour.slides.portfolio.title"),
        description: t("walletV4Tour.slides.portfolio.description"),
      },
      {
        id: "navigation" as const,
        title: t("walletV4Tour.slides.navigation.title"),
        description: t("walletV4Tour.slides.navigation.description"),
      },
      {
        id: "actions" as const,
        title: t("walletV4Tour.slides.actions.title"),
        description: t("walletV4Tour.slides.actions.description"),
      },
    ],
    [t],
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-screen min-h-0 flex-col">
        <DialogHeader density="compact" onClose={onClose} />
        <Slides
          key={isOpen ? "open" : "closed"}
          initialSlideIndex={0}
          onSlideChange={onSlideChange}
        >
          <Slides.Content>
            {slides.map((slide, index) => (
              <Slides.Content.Item key={slide.id}>
                <SlideItem slideIndex={index} title={slide.title} description={slide.description} />
              </Slides.Content.Item>
            ))}
          </Slides.Content>

          <Slides.ProgressIndicator>
            <TourProgressIndicator />
          </Slides.ProgressIndicator>

          <Slides.Footer>
            <SlideFooterButton onComplete={onComplete} />
          </Slides.Footer>
        </Slides>
      </DialogContent>
    </Dialog>
  );
};
