import React from "react";
import { MainBody } from "./components";
import { Header } from "LLD/AnalyticsOptInPrompt/screens/components";
import { Flex } from "@ledgerhq/react-ui";
import { useLocation } from "react-router";

const Main = () => {
  const { pathname } = useLocation();
  const paddingTop = pathname === "/" ? "40px" : undefined;

  return (
    <Flex flexDirection={"column"} rowGap={"32px"} mx={"40px"} height={"100%"} pt={paddingTop}>
      <Header title={"analyticsOptInPrompt.common.title"} />
      <MainBody />
    </Flex>
  );
};

export default Main;
