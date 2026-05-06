import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { Slides } from "LLD/components/Slides";
import { ProductTourFooter } from "./components/ProductTourFooter";
import { ProductTourProgressIndicator } from "./components/ProductTourProgressIndicator";
import { ProductTourSlideItem } from "./components/ProductTourSlideItem";
import { PRODUCT_TOUR_SLIDE_COUNT } from "./const";
import type { ProductTourPrimaryAction } from "./const";

export interface ProductTourDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onComplete: () => void;
  readonly onPrimaryAction: (action: ProductTourPrimaryAction) => void;
  readonly onSlideChange?: (index: number) => void;
}

export const ProductTourDialog = ({
  isOpen,
  onClose,
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
          <ProductTourSlideItem title="title" subtitle="subtitle" />
        </Slides.Content.Item>
      )),
    [],
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-screen min-h-0 flex-col">
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
  );
};
