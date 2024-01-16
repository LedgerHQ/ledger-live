import React, { memo } from "react";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";

const Container = styled(Flex).attrs({
  paddingVertical: 20,
  flex: 1,
})``;

function Main() {
  return (
    <Container alignItems="center">
      <Text variant="h1" fontWeight="medium" color="neutral.c100">
        {"Analytics Opt In Prompt Main Variant 2"}
      </Text>
      <TrackScreen category="Analytics Opt In Prompt" name="Main" />
    </Container>
  );
}

export default memo(Main);
