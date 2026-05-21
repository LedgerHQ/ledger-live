import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { Slides } from "LLD/components/Slides";
import TrackPage from "~/renderer/analytics/TrackPage";
import { ProductTourFooter } from "./components/ProductTourFooter";
import { ProductTourProgressIndicator } from "./components/ProductTourProgressIndicator";
import { ProductTourSlideItem } from "./components/ProductTourSlideItem";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_SLIDE_COUNT } from "./const";
import type { ProductTourPrimaryAction } from "./const";

export interface ProductTourDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onDismiss: () => void;
  readonly onComplete: () => void;
  readonly onPrimaryAction: (action: ProductTourPrimaryAction) => void;
  readonly onSlideChange?: (index: number) => void;
}

export const ProductTourDialog = ({
  isOpen,
  onClose,
  onDismiss,
  onComplete,
  onPrimaryAction,
  onSlideChange,
}: ProductTourDialogProps) => {
  const slideItems = useMemo(
    () =>
      Array.from({ length: PRODUCT_TOUR_SLIDE_COUNT }, (_, index) => (
        <Slides.Content.Item
          key={`product-tour-${index}`}
          data-testid={`product-tour-slide-${index}`}
        >
          <ProductTourSlideItem slideIndex={index} />
        </Slides.Content.Item>
      )),
    [],
  );

  return (
    <ThemeProvider colorScheme="dark">
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent
          className="flex h-screen min-h-0 flex-col"
          onPointerDownOutside={onDismiss}
          onEscapeKeyDown={onDismiss}
        >
          {isOpen && <TrackPage category={PAGE_TRACKING_PRODUCT_TOUR} />}
          <DialogHeader density="compact" onClose={onClose} />
          <Slides
            key={isOpen ? "reset" : "closed"}
            initialSlideIndex={0}
            onSlideChange={onSlideChange}
          >
            <Slides.Content>{slideItems}</Slides.Content>

            <Slides.ProgressIndicator>
              <ProductTourProgressIndicator />
            </Slides.ProgressIndicator>

            <Slides.Footer>
              <ProductTourFooter onPrimaryAction={onPrimaryAction} onComplete={onComplete} />
            </Slides.Footer>
          </Slides>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};
