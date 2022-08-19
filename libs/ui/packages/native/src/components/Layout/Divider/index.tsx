import { Flex } from "../index";
import styled from "styled-components/native";

const Divider = styled(Flex).attrs(() => ({
  my: 4,
  height: 1,
  backgroundColor: "neutral.c40",
}))``;

export default Divider;
