import React, { memo } from "react";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTheme } from "styled-components";
import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import AnalyticsOptInPromptSteps from "LLD/features/AnalyticsOptInPrompt/screens/AnalyticsOptInPromptSteps";
import Box from "~/renderer/components/Box";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { useDrawerLogic } from "../hooks/useDrawerLogic";

interface AnalyticsOptInPromptProps {
  onClose: () => void;
  onSubmit?: () => void;
  isOpened?: boolean;
  entryPoint: EntryPoint;
  shouldWeTrack: boolean;
}

const AnalyticsOptInPrompt = memo(
  ({ onClose, onSubmit, isOpened, entryPoint, shouldWeTrack }: AnalyticsOptInPromptProps) => {
    const { colors } = useTheme();
    const { step, setStep, handleRequestBack, handleRequestClose, preventClosable } =
      useDrawerLogic({
        entryPoint,
        shouldWeTrack,
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
        forceDisableFocusTrap
      >
        <Box height={"100%"}>
          <AnalyticsOptInPromptSteps
            step={step}
            setStep={setStep}
            onSubmit={onSubmit}
            entryPoint={entryPoint}
          />
        </Box>
      </SideDrawer>
    );
  },
);

AnalyticsOptInPrompt.displayName = "AnalyticsOptInPrompt";
export default withV3StyleProvider(AnalyticsOptInPrompt);
