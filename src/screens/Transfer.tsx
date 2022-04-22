import React, { useState } from "react";
import { Icons } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import Touchable from "../components/Touchable";
import CreateModal from "../modals/Create";
import { lockSubject } from "../components/RootNavigator/CustomBlockRouterNavigator";

const TransferButton = styled(Touchable)`
  border-radius: 40px;
  height: 64px;
  width: 64px;
  align-items: center;
  justify-content: center;
  bottom: 14px;
  background-color: ${p => p.theme.colors.palette.neutral.c100};
`;

const hitSlop = {
  top: 10,
  left: 25,
  right: 25,
  bottom: 25,
};

export default () => null;

export function TransferTabIcon() {
  const [isModalOpened, setIsModalOpened] = useState(false);

  function openModal() {
    setIsModalOpened(true);
  }

  function onModalClose() {
    setIsModalOpened(false);
  }

  return (
    <>
      <TransferButton
        event="Transfer"
        disabled={lockSubject.getValue()}
        hitSlop={hitSlop}
        onPress={openModal}
      >
        <Icons.TransferMedium size={28} color={"palette.background.main"} />
      </TransferButton>
      <CreateModal isOpened={isModalOpened} onClose={onModalClose} />
    </>
  );
}
