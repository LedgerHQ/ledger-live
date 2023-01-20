import Flex, { FlexBoxProps } from "../Flex";
import styled from "styled-components/native";

const Divider = styled(Flex).attrs<FlexBoxProps>((p: FlexBoxProps) => ({
  my: p.my || 4,
  height: 1,
  backgroundColor: "neutral.c40",
}))``;

export default Divider;
