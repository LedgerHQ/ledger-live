import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import InfoIcon from "../../../components/InfoIcon";
import Trash from "../../../icons/Trash";

import ActionModal from "./ActionModal";

type Props = {
  isOpened: boolean,
  onClose: () => void,
  onConfirm: () => void,
};

const UninstallAllModal = ({ isOpened, onClose, onConfirm }: Props) => {
  const { colors } = useTheme();

  const modalActions = useMemo(
    () => [
      {
        title: <Trans i18nKey="common.uninstall" />,
        onPress: onConfirm,
        type: "alert",
        event: "ManagerUninstallAllConfirm",
      },
      {
        title: <Trans i18nKey="common.cancel" />,
        onPress: onClose,
        type: "secondary",
        outline: false,
        event: "ManagerUninstallAllCancel",
      },
    ],
    [onConfirm, onClose],
  );

  return (
    <ActionModal isOpened={!!isOpened} onClose={onClose} actions={modalActions}>
      <View style={styles.image}>
        <InfoIcon bg={colors.lightLive}>
          <Trash size={30} color={colors.live} />
        </InfoIcon>
      </View>
      <View style={styles.infoRow}>
        <LText style={[styles.warnText, styles.title]} bold>
          <Trans i18nKey="manager.uninstall.subtitle" />
        </LText>
        <LText style={styles.warnText} color="grey">
          <Trans i18nKey="manager.uninstall.description" />
        </LText>
      </View>
    </ActionModal>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 80,
    marginVertical: 24,
  },
  title: {
    fontSize: 16,
  },
  warnText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 16,
    marginVertical: 8,
  },
  infoRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(UninstallAllModal);
