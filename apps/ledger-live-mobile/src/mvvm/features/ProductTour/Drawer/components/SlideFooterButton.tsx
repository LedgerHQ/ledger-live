import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { useSlideFooterButtonViewModel } from "../hooks/useSlideFooterButtonViewModel";
import type { ProductTourPrimaryAction } from "../const";

interface SlideFooterButtonProps {
  readonly onPrimaryAction: (action: ProductTourPrimaryAction) => void;
  readonly onComplete: () => void;
}

export const SlideFooterButton = ({ onPrimaryAction, onComplete }: SlideFooterButtonProps) => {
  const { primaryLabel, secondaryLabel, handleCTA, handleContinue } = useSlideFooterButtonViewModel(
    { onPrimaryAction, onComplete },
  );

  return (
    <Box lx={{ width: "full" }}>
      <Button appearance="base" size="lg" onPress={handleCTA}>
        {primaryLabel}
      </Button>
      <Button appearance="gray" size="lg" onPress={handleContinue} lx={{ marginTop: "s16" }}>
        {secondaryLabel}
      </Button>
    </Box>
  );
};
