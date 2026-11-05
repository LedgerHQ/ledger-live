import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioButtonSection } from "LLM/features/WalletAssets/views/ButtonSection";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

interface AssetsButtonSectionProps {
  variant: WalletAssetsVariant;
}

export const AssetsButtonSection: React.FC<AssetsButtonSectionProps> = ({ variant }) => {
  if (variant === "readOnly") return null;

  return (
    <Box lx={{ paddingTop: "s24" }}>
      <PortfolioButtonSection />
    </Box>
  );
};
