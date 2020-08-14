// @flow
import React, { useState, useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import LText from "../../../components/LText";
import InfoModal from "../../../modals/Info";
import colors from "../../../colors";

type Props = {
  disabled?: boolean,
  onPress: () => void,
};

export default function DelegationLabelRight({ onPress, disabled }: Props) {
  const { t } = useTranslation();

  const [disabledModalOpen, setDisabledModalOpen] = useState(false);

  const onClick = useCallback(() => {
    if (disabled) setDisabledModalOpen(true);
    else onPress();
  }, [onPress, disabled]);

  const onCloseModal = useCallback(() => setDisabledModalOpen(false), []);

  return (
    <TouchableOpacity onPress={onClick}>
      <LText
        semiBold
        style={[styles.actionColor, disabled ? { color: colors.grey } : {}]}
      >
        {t("account.delegation.addDelegation")}
      </LText>
      <InfoModal
        isOpened={!!disabledModalOpen}
        onClose={onCloseModal}
        data={[
          {
            title: t("cosmos.info.delegationUnavailable.title"),
            description: t("cosmos.info.delegationUnavailable.description"),
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  actionColor: {
    color: colors.live,
  },
});
