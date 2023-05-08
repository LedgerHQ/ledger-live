import React from "react";
import { Trans } from "react-i18next";
import { Text, Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import DAppsIcons from "../../../icons/DAppsIcons";

const Container = styled(Flex).attrs({
  width: "100%",
  flexDirection: "column",
  borderRadius: 4,
  p: 6,
  mb: 6,
  overflow: "hidden",
  position: "relative",
  bg: "constant.purple",
})``;

const CatalogBanner = () => (
  <Container>
    <Text
      variant="h3"
      fontWeight="semiBold"
      color="constant.black"
      mb="8px"
      testID="discover-banner"
    >
      <Trans i18nKey="platform.catalog.banner.title" />
    </Text>
    <Text variant="body" color="constant.black" pr={50}>
      <Trans i18nKey="platform.catalog.banner.description" />
    </Text>
    <DAppsIcons
      style={{
        position: "absolute",
        width: "100%",
        height: "150%",
        right: "-40%",
        zIndex: -1,
      }}
    />
  </Container>
);
export default CatalogBanner;
