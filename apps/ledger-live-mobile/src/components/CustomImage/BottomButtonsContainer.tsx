import { Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

const BottomButtonsContainer = styled(Flex).attrs({
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  padding: 6,
  pb: 8,
})``;

export default BottomButtonsContainer;
