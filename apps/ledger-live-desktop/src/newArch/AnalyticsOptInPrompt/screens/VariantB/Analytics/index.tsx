import { Flex } from "@ledgerhq/react-ui";
import { Header } from "./components";
import { Body } from "LLD/AnalyticsOptInPrompt/screens/VariantB/components";
import React from "react";
import { useLocation } from "react-router";
import Track from "~/renderer/analytics/Track";

interface AnalyticsScreenProps {
  currentTheme: "dark" | "light";
  shouldWeTrack: boolean;
  handleOpenPrivacyPolicy: (page: string) => void;
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

const page = "Analytics Prompt Page 1 option B";

const AnalyticsScreen = ({
  currentTheme,
  shouldWeTrack,
  handleOpenPrivacyPolicy,
}: AnalyticsScreenProps) => {
  const { pathname } = useLocation();
  const paddingTop = pathname === "/" ? "40px" : undefined;
  return (
    <>
      <Track onMount mandatory={shouldWeTrack} event={page} page={page} />
      <Flex flexDirection={"column"} height={"100%"} rowGap={32} pt={paddingTop}>
        <Header currentTheme={currentTheme} />
        <Body {...bodyProps} handleOpenPrivacyPolicy={() => handleOpenPrivacyPolicy(page)} />
      </Flex>
    </>
  );
};

export default AnalyticsScreen;
