// @flow
import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import LText from "../../../components/LText";

type Props = {
  disabled?: boolean,
  onPress: () => void,
};

export default function DelegationLabelRight({ onPress, disabled }: Props) {
  const { t } = useTranslation();

  const onClick = useCallback(() => {
    if (disabled) setDisabledModalOpen(true);
    else onPress();
  }, [onPress, disabled]);

  return (
    <TouchableOpacity onPress={onClick}>
      <LText semiBold color={disabled ? "grey" : "live"}>
        {t("account.delegation.addDelegation")}
      </LText>
    </TouchableOpacity>
  );
}
