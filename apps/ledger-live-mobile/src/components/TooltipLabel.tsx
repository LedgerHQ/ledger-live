import React, { useCallback, useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import LText, { Opts as LTextProps } from "./LText";
import QueuedDrawer from "./QueuedDrawer";

type Props = {
  label: React.ReactNode;
  tooltip: React.ReactNode;
  color?: string;
  style?: LTextProps["style"];
};

const TooltipLabel = ({ label, tooltip, color = "grey", style }: Props) => {
  const { colors } = useTheme();
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const open = useCallback(() => setIsOpened(true), []);
  const close = useCallback(() => setIsOpened(false), []);
  return (
    <>
      <TouchableOpacity style={styles.root} onPress={open}>
        <LText style={[styles.label, style]} color={color}>
          {label}
        </LText>
        <Icon
          size={13}
          color={colors[color as keyof typeof colors]}
          name={"info-circle"}
        />
      </TouchableOpacity>
      <QueuedDrawer
        isRequestingToBeOpened={isOpened}
        onClose={close}
        style={styles.modal}
      >
        <LText semiBold style={styles.tooltip}>
          {tooltip}
        </LText>
      </QueuedDrawer>
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
    marginRight: 6,
  },
  modal: {
    padding: 16,
  },
  tooltip: {
    fontSize: 14,
  },
});
export default TooltipLabel;
