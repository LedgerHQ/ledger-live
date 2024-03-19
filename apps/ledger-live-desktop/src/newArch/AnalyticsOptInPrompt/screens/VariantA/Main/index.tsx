import React from "react";
import { MainBody } from "./components";
import { HeaderTitle } from "LLD/AnalyticsOptInPrompt/screens/components";
import { Flex } from "@ledgerhq/react-ui";
import { useLocation } from "react-router";
import Track from "~/renderer/analytics/Track";

interface MainProps {
  shouldWeTrack: boolean;
  handleOpenPrivacyPolicy: () => void;
}

const Main = ({ shouldWeTrack, handleOpenPrivacyPolicy }: MainProps) => {
  const { pathname } = useLocation();
  const paddingTop = pathname === "/" ? "40px" : undefined;

  return (
    <>
      <Track
        onMount
        mandatory={shouldWeTrack}
        event={"Analytics opt-in prompt main"}
        page={"Analytics opt-in prompt main"}
      />
      <Flex flexDirection={"column"} rowGap={"32px"} mx={"40px"} height={"100%"} pt={paddingTop}>
        <HeaderTitle title={"analyticsOptInPrompt.common.title"} />
        <MainBody handleOpenPrivacyPolicy={handleOpenPrivacyPolicy} />
      </Flex>
    </>
  );
};

export default Main;
