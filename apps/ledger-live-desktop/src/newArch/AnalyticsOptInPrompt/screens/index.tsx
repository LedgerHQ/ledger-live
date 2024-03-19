import React, { memo } from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTheme } from "styled-components";
import { EntryPoint } from "LLD/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import VariantA from "LLD/AnalyticsOptInPrompt/screens/VariantA";
import VariantB from "LLD/AnalyticsOptInPrompt/screens/VariantB";
import Box from "~/renderer/components/Box";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { useDrawerLogic } from "../hooks/useDrawerLogic";

interface AnalyticsOptInPromptProps {
  onClose: () => void;
  onSubmit?: () => void;
  isOpened?: boolean;
  entryPoint: EntryPoint;
  variant: ABTestingVariants;
}

const AnalyticsOptInPrompt = memo(
  ({ onClose, onSubmit, isOpened, entryPoint, variant }: AnalyticsOptInPromptProps) => {
    const { colors } = useTheme();
    const { step, setStep, handleRequestBack, handleRequestClose, preventClosable, isVariantB } =
      useDrawerLogic({
        entryPoint,
        variant,
        onClose,
      });

    return (
      <SideDrawer
        withPaddingTop
        isOpen={isOpened}
        direction={"left"}
        onRequestBack={step === 0 ? undefined : handleRequestBack}
        onRequestClose={preventClosable ? undefined : handleRequestClose}
        style={{
          background: colors.background.main,
        }}
      >
        <Box height={"100%"}>
          {isVariantB ? (
            <VariantB step={step} setStep={setStep} onSubmit={onSubmit} entryPoint={entryPoint} />
          ) : (
            <VariantA step={step} setStep={setStep} onSubmit={onSubmit} entryPoint={entryPoint} />
          )}
        </Box>
      </SideDrawer>
    );
  },
);

AnalyticsOptInPrompt.displayName = "AnalyticsOptInPrompt";
export default withV3StyleProvider(AnalyticsOptInPrompt);
