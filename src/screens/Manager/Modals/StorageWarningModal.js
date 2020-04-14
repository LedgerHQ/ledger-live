import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import colors from "../../../colors";
import LText from "../../../components/LText";
import InfoIcon from "../../../components/InfoIcon";
import Exclamation from "../../../icons/Exclamation";
import Storage from "../../../icons/Storage";

import ActionModal from "./ActionModal";

type Props = {
  warning: boolean,
  onClose: () => void,
};

const StorageWarningModal = ({ warning, onClose }: Props) => {
  const modalActions = useMemo(
    () => [
      {
        title: <Trans i18nKey="common.close" />,
        onPress: onClose,
        type: "primary",
        event: "ManagerStorageWarningModalClose",
      },
    ],
    [onClose],
  );

  return (
    <ActionModal isOpened={!!warning} onClose={onClose} actions={modalActions}>
      <View style={styles.storageImage}>
        <InfoIcon
          bg={colors.lightLive}
          floatingIcon={<Exclamation size={36} color={colors.white} />}
          floatingBg={colors.lightOrange}
        >
          <Storage size={30} color={colors.live} />
        </InfoIcon>
      </View>
      <View style={styles.storageRow}>
        <LText style={[styles.warnText, styles.title]} bold>
          <Trans i18nKey="errors.ManagerNotEnoughSpace.title" />
        </LText>
        <LText style={styles.warnText}>
          <Trans
            i18nKey="errors.ManagerNotEnoughSpace.info"
            values={{ app: warning }}
          />
        </LText>
      </View>
    </ActionModal>
  );
};

const styles = StyleSheet.create({
  storageImage: {
    width: 80,
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  warnText: {
    textAlign: "center",
    fontSize: 13,
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

export default memo(StorageWarningModal);
