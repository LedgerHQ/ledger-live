import React from "react";
import AnalyticsScreen from "./Analytics";
import RecommandationsScreen from "./PersonalRecommendations";
import { useVariantB } from "LLD/AnalyticsOptInPrompt/hooks/useVariantB";
import Footer from "LLD/AnalyticsOptInPrompt/screens/VariantB/components/Footer";
import { Flex } from "@ledgerhq/react-ui";
import { EntryPoint } from "../../types/AnalyticsOptInPromptNavigator";

interface VariantBProps {
  entryPoint: EntryPoint;
  onSubmit?: () => void;
  step: number;
  setStep: (value: number) => void;
}

const VariantB = ({ entryPoint, onSubmit, step, setStep }: VariantBProps) => {
  const { currentTheme, clickOptions, shouldWeTrack, handleOpenPrivacyPolicy } = useVariantB({
    entryPoint,
    onSubmit,
    step,
    setStep,
  });
  return (
    <>
      <Flex flexDirection={"column"} mx={"40px"} height={"100%"} pt={"40"}>
        {step === 0 ? (
          <AnalyticsScreen
            handleOpenPrivacyPolicy={handleOpenPrivacyPolicy}
            currentTheme={currentTheme}
            shouldWeTrack={shouldWeTrack}
          />
        ) : (
          <RecommandationsScreen
            handleOpenPrivacyPolicy={handleOpenPrivacyPolicy}
            currentTheme={currentTheme}
            shouldWeTrack={shouldWeTrack}
          />
        )}
      </Flex>
      <Footer clickOptions={clickOptions} />
    </>
  );
};
export default VariantB;
