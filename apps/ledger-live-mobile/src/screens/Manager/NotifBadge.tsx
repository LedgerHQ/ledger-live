import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

const Badge = styled(Flex).attrs({
  bg: "constant.purple",
  borderColor: "background.main",
  position: "absolute",
  top: -5,
  right: -4,
  width: 14,
  height: 14,
  borderRadius: 7,
  borderWidth: 3,
})``;

export default Badge;
