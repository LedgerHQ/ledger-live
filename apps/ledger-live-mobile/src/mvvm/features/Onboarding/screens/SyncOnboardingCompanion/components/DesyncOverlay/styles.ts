import { Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

export const Container = styled(Flex).attrs({
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "constant.overlay",
  zIndex: 100,
})``;
