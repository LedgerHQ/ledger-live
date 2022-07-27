import { Flex } from "@ledgerhq/native-ui";
import React, { PropsWithChildren } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";

type Props = PropsWithChildren<{}>;

const Container = styled(Flex).attrs({
  flexDirection: "column",
  alignSelf: "stretch",
  backgroundColor: "background.drawer",
  borderTopLeftRadius: "16px",
  borderTopRightRadius: "16px",
})``;
const Inner = styled(Flex).attrs({
  padding: 6,
  pb: 8,
})``;

const BottomButtonsContainer: React.FC<Props> = ({ children }) => {
  const insets = useSafeAreaInsets();
  return (
    <Container paddingBottom={insets.bottom}>
      <Inner>{children}</Inner>
    </Container>
  );
};

export default BottomButtonsContainer;
