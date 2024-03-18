import { Flex } from "@ledgerhq/react-ui";
import { Header } from "./components";
import { Body } from "LLD/AnalyticsOptInPrompt/screens/VariantB/components";
import React from "react";
import { useLocation } from "react-router";

interface AnalyticsScreenProps {
  currentTheme: "dark" | "light";
}

const listItems = [
  "analyticsOptInPrompt.variantB.analytics.details.1",
  "analyticsOptInPrompt.variantB.analytics.details.2",
  "analyticsOptInPrompt.variantB.analytics.details.3",
];

const title = "analyticsOptInPrompt.common.title";

const description = "analyticsOptInPrompt.variantB.analytics.description";

const bodyProps = {
  listItems,
  title,
  description,
};

const AnalyticsScreen = ({ currentTheme }: AnalyticsScreenProps) => {
  const { pathname } = useLocation();
  const paddingTop = pathname === "/" ? "40px" : undefined;
  return (
    <Flex flexDirection={"column"} height={"100%"} rowGap={32} pt={paddingTop}>
      <Header currentTheme={currentTheme} />
      <Body {...bodyProps} />
    </Flex>
  );
};

export default AnalyticsScreen;
