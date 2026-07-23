import React, { memo } from "react";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTheme } from "styled-components";
import type { AnalyticsOptInPromptHostProps } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import AnalyticsOptInScreen from "LLD/features/AnalyticsOptInPrompt/screens/AnalyticsOptInScreen";
import { AnalyticsOptInScreenV2 } from "LLD/features/AnalyticsOptInScreenV2";
import Box from "~/renderer/components/Box";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { useDrawerLogic } from "../hooks/useDrawerLogic";
import { useShouldUseAnalyticsOptInScreenV2 } from "../hooks/useShouldUseAnalyticsOptInScreenV2";

const AnalyticsOptInPromptLegacyDrawer = memo(
  ({ onClose, onSubmit, isOpened, entryPoint }: AnalyticsOptInPromptHostProps) => {
    const { colors } = useTheme();
    const { step, setStep, handleRequestBack, handleRequestClose, preventClosable } =
      useDrawerLogic({
        entryPoint,
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
          <AnalyticsOptInScreen
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

AnalyticsOptInPromptLegacyDrawer.displayName = "AnalyticsOptInPromptLegacyDrawer";

const AnalyticsOptInPrompt = memo((props: AnalyticsOptInPromptHostProps) => {
  const shouldUseScreenV2 = useShouldUseAnalyticsOptInScreenV2(props.entryPoint);

  if (shouldUseScreenV2) {
    return <AnalyticsOptInScreenV2 {...props} />;
  }

  return <AnalyticsOptInPromptLegacyDrawer {...props} />;
});

AnalyticsOptInPrompt.displayName = "AnalyticsOptInPrompt";
export default withV3StyleProvider(AnalyticsOptInPrompt);
