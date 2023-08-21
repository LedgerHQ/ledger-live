import { memo } from "react";
import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

const SectionContainer = styled(Flex).attrs((p: { isFirst: boolean }) => ({
  py: 8,
  borderTopWidth: p.isFirst ? 0 : 1,
  borderTopColor: "neutral.c30",
}))``;

export default memo(SectionContainer);
