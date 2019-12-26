import React, { memo, useState, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import Trash from "../../../icons/Trash";
import colors from "../../../colors";

import UninstallAllModal from "../Modals/UninstallAllModal";
import LText from "../../../components/LText";

type Props = {
  onUninstallAll: Function,
};

const UninstallAllButton = ({ onUninstallAll }: Props) => {
  const [isOpened, openModal] = useState(false);
  const toggleModal = useCallback(value => () => openModal(value), [openModal]);
  const onConfirm = useCallback(() => {
    onUninstallAll();
    openModal(false);
  }, [onUninstallAll, openModal]);

  return (
    <>
      <TouchableOpacity
        style={styles.uninstallButton}
        activeOpacity={0.5}
        onPress={toggleModal(true)}
      >
        <View style={styles.uninstallIcon}>
          <Trash size={16} color={colors.live} />
        </View>
        <LText style={styles.uninstallText}>
          <Trans i18nKey="manager.uninstall.title" />
        </LText>
      </TouchableOpacity>
      <UninstallAllModal
        isOpened={isOpened}
        onClose={toggleModal(false)}
        onConfirm={onConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  uninstallButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  uninstallIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    width: 38,
  },
  uninstallText: {
    fontSize: 14,
    color: colors.live,
  },
});

export default memo(UninstallAllButton);
