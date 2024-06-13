import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

const FlexContainer = styled(Flex)`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
`;

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

const DummyDrawer = ({ isOpen, handleClose }: Props) => {
  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
      <Text>{"Dummy Drawer"}</Text>
      <Flex flexDirection={"row"} justifyContent={"center"} alignItems={"flex-end"}>
        <FlexContainer>
          <Flex
            bg={"opacityPurple.c10"}
            borderRadius={"8px"}
            width={"36px"}
            height={"36px"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Icons.Mobile color={"primary.c80"} />
          </Flex>
        </FlexContainer>
      </Flex>
    </QueuedDrawer>
  );
};

export default DummyDrawer;
