import React, { useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import LText from "~/components/LText";
import InfoModal from "~/modals/Info";

type Props = {
  disabled?: boolean;
  onPress: () => void;
};
export default function LabelRight({ onPress, disabled }: Props) {
  const { t } = useTranslation();
  const [disabledModalOpen, setDisabledModalOpen] = useState(false);
  const onClick = useCallback(() => {
    if (disabled) setDisabledModalOpen(true);
    else onPress();
  }, [onPress, disabled]);
  const onCloseModal = useCallback(() => setDisabledModalOpen(false), []);
  return (
    <TouchableOpacity onPress={onClick}>
      <LText semiBold color={disabled ? "grey" : "live"}>
        {t("near.staking.add")}
      </LText>
      <InfoModal
        isOpened={!!disabledModalOpen}
        onClose={onCloseModal}
        data={[
          {
            title: t("near.info.stakingUnavailable.title"),
            description: t("near.info.stakingUnavailable.description"),
          },
        ]}
      />
    </TouchableOpacity>
  );
}
