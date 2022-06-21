import React, { useState, useCallback } from "react";
import { useTheme } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import { Text, IconLink } from "@ledgerhq/native-ui";
import InfoModal from "../../../components/InfoModal";

interface Props {
  label: React.ReactNode;
  tooltip?: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

export function Section({ label, tooltip, onEdit }: Props) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(true);
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <View style={styles.root}>
      {onEdit ? <IconLink /> : <Text>{label}</Text>}
      {tooltip && (
        <InfoModal desc={tooltip} onClose={close} isOpened={isOpen} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  label: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  tooltipText: { fontSize: 14, lineHeight: 20, marginRight: 4 },
  // value: {
  //   flexDirection: "row",
  //   justifyContent: "flex-end",
  //   alignItems: "center",
  // },
  // editText: { fontSize: 12, margin: 0 },
  // editButton: { paddingLeft: 8, paddingVertical: 4 },
});
