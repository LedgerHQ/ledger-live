// @flow
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { View, TouchableOpacity, StyleSheet } from "react-native";

import LText from "../../../components/LText";
import InfoModal from "../../../components/InfoModal";
import InfoIcon from "../../../icons/Info";

type Props = {
  label: React$Node,
  tooltip?: React$Node,
  children: React$Node,
  onEdit?: () => void,
};

export default function GenericInputLink({
  label,
  tooltip,
  children,
  onEdit,
}: Props) {
  const { colors } = useTheme();

  const [tooltipOpen, setTooltipOpen] = useState();

  const openTooltip = useCallback(() => setTooltipOpen(true), []);
  const closeTooltip = useCallback(() => setTooltipOpen(false), []);

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.label} onPress={openTooltip}>
        <LText color="grey" style={styles.tooltipText}>
          {label}
        </LText>
        {tooltip ? <InfoIcon size={12} color={colors.grey} /> : null}
      </TouchableOpacity>
      <View style={styles.value}>{children}</View>

      {onEdit ? (
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <LText color="live" semiBold style={styles.editText}>
            <Trans i18nKey="common.edit" />
          </LText>
        </TouchableOpacity>
      ) : null}

      {tooltip ? (
        <InfoModal
          desc={tooltip}
          onClose={closeTooltip}
          isOpened={!!tooltipOpen}
        />
      ) : null}
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
  value: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  editText: { fontSize: 12, margin: 0 },
  editButton: { paddingLeft: 8, paddingVertical: 4 },
});
