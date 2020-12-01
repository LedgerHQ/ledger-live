import React from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import colors from "../../../colors";
import LText from "../../../components/LText";
import InfoIcon from "../../../components/InfoIcon";
import Info from "../../../icons/Info";

import ActionModal from "./ActionModal";

type Props = {
  isOpened: boolean,
  onClose: () => void,
};

const QuitManagerModal = ({ isOpened, onClose }: Props) => {
  return (
    <ActionModal isOpened={!!isOpened} onClose={onClose} actions={[]}>
      <View style={styles.storageImage}>
        <InfoIcon bg={colors.lightLive}>
          <Info size={30} color={colors.live} />
        </InfoIcon>
      </View>
      <View style={styles.storageRow}>
        <LText secondary style={[styles.text, styles.title]} semiBold>
          <Trans i18nKey={`manager.firmware.modalTitle`} />
        </LText>
        <LText style={styles.text}>
          <Trans i18nKey={`manager.firmware.modalDesc`} />
        </LText>
      </View>
    </ActionModal>
  );
};

const styles = StyleSheet.create({
  storageImage: {
    width: 80,
    marginVertical: 24,
  },
  title: {
    lineHeight: 24,
    fontSize: 16,
    color: colors.darkBlue,
  },
  text: {
    textAlign: "center",
    fontSize: 14,
    color: colors.grey,
    lineHeight: 16,
    marginVertical: 8,
  },
  storageRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default QuitManagerModal;
