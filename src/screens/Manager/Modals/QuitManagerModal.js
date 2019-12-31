import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import colors from "../../../colors";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import InfoIcon from "../../../components/InfoIcon";
import Quit from "../../../icons/Quit";

import ActionModal from "./ActionModal";

type Props = {
  isOpened: boolean,
  onClose: Function,
  onConfirm: Function,
};

const QuitManagerModal = ({ isOpened, onConfirm, onClose }: Props) => {

  return (
    <ActionModal isOpened={!!isOpened} onClose={onClose} actions={[]}>
      <View style={styles.storageImage}>
        <InfoIcon bg={colors.lightLive}>
          <Quit size={30} color={colors.live} />
        </InfoIcon>
      </View>
      <View style={styles.storageRow}>
        <LText style={[styles.warnText, styles.title]} bold>
          <Trans i18nKey="errors.ManagerQuitPage.title" />
        </LText>
        <LText style={styles.warnText}>
          <Trans i18nKey="errors.ManagerQuitPage.description" />
        </LText>
      </View>
      <View style={styles.buttonRow}>
        <Button
          containerStyle={styles.button}
          title={<Trans i18nKey="errors.ManagerQuitPage.stay" />}
          onPress={onClose}
          type={"secondary"}
        />
        <Button
          containerStyle={[styles.button, { marginLeft: 16 }]}
          title={<Trans i18nKey="errors.ManagerQuitPage.quit" />}
          onPress={onConfirm}
          type={"primary"}
        />
      </View>
    </ActionModal>
  );
};

const styles = StyleSheet.create({
  storageImage: {
    width: 80,
    marginBottom: 24,
  },
  title: {
    lineHeight: 24,
    fontSize: 20,
    color: colors.darkBlue,
  },
  warnText: {
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
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});

export default memo(QuitManagerModal);
