import React from "react";
import AnalyticsScreen from "./Analytics";
import RecommandationsScreen from "./PersonalRecommendations";
import { useVariantB } from "LLD/AnalyticsOptInPrompt/hooks/useVariantB";
import Footer from "LLD/AnalyticsOptInPrompt/screens/VariantB/components/Footer";
import { Flex } from "@ledgerhq/react-ui";
import { EntryPoint } from "../../types/AnalyticsOptInPromptNavigator";

interface VariantBProps {
  setPreventBackNavigation: (value: boolean) => void;
  entryPoint: EntryPoint;
  goBackToMain: boolean;
  onSubmit?: () => void;
}

const VariantB = ({
  entryPoint,
  goBackToMain,
  onSubmit,
  setPreventBackNavigation,
}: VariantBProps) => {
  const { currentStep, currentTheme, clickOptions } = useVariantB({
    setPreventBackNavigation,
    goBackToMain,
    entryPoint,
    onSubmit,
  });
  return (
    <>
      <Flex flexDirection={"column"} mx={"40px"} height={"100%"} pt={"40"}>
        {currentStep === 0 ? (
          <AnalyticsScreen currentTheme={currentTheme} />
        ) : (
          <RecommandationsScreen currentTheme={currentTheme} />
        )}
      </Flex>
      <Footer currentStep={currentStep} clickOptions={clickOptions} />
    </>
  );
};
export default VariantB;
