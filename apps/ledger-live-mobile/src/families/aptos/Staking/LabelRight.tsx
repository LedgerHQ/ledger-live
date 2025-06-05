import React, { useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import LText from "~/components/LText";
import InfoModal from "~/modals/Info";

type Props = {
  disabled?: boolean;
  onPress: () => void;
};

export default function LabelRight({ onPress, disabled }: Readonly<Props>) {
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
        {t("aptos.staking.add")}
      </LText>
      <InfoModal
        isOpened={!!disabledModalOpen}
        onClose={onCloseModal}
        data={[
          {
            title: t("aptos.info.stakingUnavailable.title"),
            description: t("aptos.info.stakingUnavailable.description"),
          },
        ]}
      />
    </TouchableOpacity>
  );
}
