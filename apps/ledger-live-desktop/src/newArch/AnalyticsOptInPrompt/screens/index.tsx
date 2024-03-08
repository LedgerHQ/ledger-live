import React, { useEffect, useState, useCallback, memo } from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTheme } from "styled-components";
import { EntryPoint } from "LLD/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import { getVariant } from "LLD/AnalyticsOptInPrompt/hooks/useCommonLogic";
import useVariantA from "LLD/AnalyticsOptInPrompt/hooks/useVariantA";
import Box from "~/renderer/components/Box";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

interface AnalyticsOptInPromptProps {
  onClose?: () => void;
  onSubmit?: () => void;
  isOpened?: boolean;
  entryPoint?: EntryPoint;
  variant?: ABTestingVariants;
}

const AnalyticsOptInPrompt = memo(
  ({ onClose, onSubmit, isOpened, entryPoint, variant }: AnalyticsOptInPromptProps) => {
    const { colors } = useTheme();

    const isNotOnBoarding = entryPoint?.toLocaleLowerCase() !== EntryPoint.onboarding;
    const [preventClosable, setPreventClosable] = useState(false);
    const [preventBackNavigation, setPreventBackNavigation] = useState(true);

    const isVariantA = getVariant(variant) === ABTestingVariants.variantA;

    useEffect(() => {
      if (isNotOnBoarding) setPreventClosable(true);
    }, [isNotOnBoarding]);

    const handleRequestBack = useCallback(() => {
      if (!preventBackNavigation) {
        setPreventBackNavigation(true);
      }
    }, [preventBackNavigation]);

    const handleRequestClose = useCallback(() => {
      if (!preventClosable && onClose) {
        onClose();
      }
    }, [preventClosable, onClose]);

    const { screen } = useVariantA({
      setPreventBackNavigation: () => setPreventBackNavigation(false),
      goBackToMain: preventBackNavigation,
      onSubmit,
    });

    return (
      <SideDrawer
        withPaddingTop
        isOpen={isOpened}
        direction={"left"}
        onRequestBack={preventBackNavigation ? undefined : handleRequestBack}
        onRequestClose={preventClosable ? undefined : handleRequestClose}
        style={{
          background: colors.background.main,
        }}
      >
        <Box height={"100%"}>{isVariantA ? screen : "variantB"}</Box>
      </SideDrawer>
    );
  },
);

AnalyticsOptInPrompt.displayName = "AnalyticsOptInPrompt";
export default withV3StyleProvider(AnalyticsOptInPrompt);
