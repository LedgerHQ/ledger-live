import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useProductTourFooterViewModel } from "../hooks/useProductTourFooterViewModel";
import type { ProductTourPrimaryAction } from "../const";

interface ProductTourFooterProps {
  readonly onPrimaryAction: (action: ProductTourPrimaryAction) => void;
  readonly onComplete: () => void;
}

export function ProductTourFooter({ onPrimaryAction, onComplete }: ProductTourFooterProps) {
  const { primaryLabel, secondaryLabel, onPrimaryClick, onSecondaryClick } =
    useProductTourFooterViewModel({
      onPrimaryAction,
      onComplete,
    });

  return (
    <div className="flex flex-col gap-8 px-20">
      <Button appearance="base" size="lg" isFull type="button" onClick={onPrimaryClick}>
        {primaryLabel}
      </Button>
      <Button appearance="transparent" size="lg" isFull type="button" onClick={onSecondaryClick}>
        {secondaryLabel}
      </Button>
    </div>
  );
}
