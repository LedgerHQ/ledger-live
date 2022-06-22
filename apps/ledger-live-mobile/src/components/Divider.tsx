import { Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

// TODO: move this component to the design system
const Divider = styled(Flex).attrs(() => ({
  my: 4,
  height: 1,
  backgroundColor: "neutral.c40",
}))``;

export default Divider;
