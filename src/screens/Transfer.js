/* @flow */
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Touchable from "../components/Touchable";
import CreateModal from "../modals/Create";
import TransferIcon from "../icons/Transfer";
import { lockSubject } from "../components/RootNavigator/CustomBlockRouterNavigator";

const hitSlop = {
  top: 10,
  left: 25,
  right: 25,
  bottom: 25,
};

export default () => null;

export function TransferTabIcon() {
  const { colors } = useTheme();
  const [isModalOpened, setIsModalOpened] = useState(false);

  function openModal() {
    setIsModalOpened(true);
  }

  function onModalClose() {
    setIsModalOpened(false);
  }

  return (
    <>
      <Touchable
        event="Transfer"
        disabled={lockSubject.getValue()}
        hitSlop={hitSlop}
        onPress={openModal}
        style={[styles.root, { backgroundColor: colors.live }]}
      >
        <TransferIcon size={20} color={"#FFF"} />
      </Touchable>
      <CreateModal isOpened={isModalOpened} onClose={onModalClose} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 39,
    height: 39,
    width: 39,
    alignItems: "center",
    justifyContent: "center",
  },
});
