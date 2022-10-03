import { memo } from "react";
import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

const SectionContainer = styled(Flex).attrs((p: { isLast: boolean }) => ({
  py: 8,
  borderBottomWidth: !p.isLast ? 1 : 0,
  borderBottomColor: "neutral.c30",
}))``;

export default memo(SectionContainer);
