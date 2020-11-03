// @flow
import React, { useCallback, useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";

import LText from "./LText";
import colors from "../colors";
import BottomModal from "./BottomModal";
import Info from "../icons/Info";

type Props = {
  label: React$Node,
  tooltip: React$Node,
  style?: *,
};

const TooltipLabel = ({ label, tooltip, style }: Props) => {
  const [isOpened, setIsOpened] = useState();
  const open = useCallback(() => setIsOpened(true), []);
  const close = useCallback(() => setIsOpened(false), []);

  return (
    <>
      <TouchableOpacity style={styles.root} onPress={open}>
        <LText style={{ ...styles.label, ...style }}>{label}</LText>
        <Info size={13} color={colors.grey} />
      </TouchableOpacity>
      <BottomModal isOpened={isOpened} onClose={close} style={styles.modal}>
        <LText semiBold style={styles.tooltip}>
          {tooltip}
        </LText>
      </BottomModal>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    color: colors.grey,
    marginRight: 6,
  },
  modal: { padding: 16 },
  tooltip: {
    fontSize: 14,
  },
});

export default TooltipLabel;
