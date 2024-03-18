import { Flex } from "@ledgerhq/react-ui";
import { Header } from "./components";
import { Body } from "LLD/AnalyticsOptInPrompt/screens/VariantB/components";
import React from "react";

interface RecommandationsScreenProps {
  currentTheme: "dark" | "light";
}

const RecommandationsScreen = ({ currentTheme }: RecommandationsScreenProps) => {
  const listItems = [
    "analyticsOptInPrompt.variantB.personalRecommendations.details.1",
    "analyticsOptInPrompt.variantB.personalRecommendations.details.2",
  ];
  const title = "analyticsOptInPrompt.variantB.personalRecommendations.title";
  const description = "analyticsOptInPrompt.variantB.personalRecommendations.description";

  const bodyProps = {
    listItems,
    title,
    description,
  };

  return (
    <>
      <Flex flexDirection={"column"} height={"100%"} rowGap={32}>
        <Header currentTheme={currentTheme} />
        <Body {...bodyProps} />
      </Flex>
    </>
  );
};

export default RecommandationsScreen;
