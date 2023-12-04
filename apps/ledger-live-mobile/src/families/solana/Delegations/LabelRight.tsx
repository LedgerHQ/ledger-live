import { Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

type Props = {
  disabled?: boolean;
  onPress: () => void;
};

export default function DelegationLabelRight({ onPress, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onPress}>
      <Text fontWeight="semiBold" color={disabled ? "neutral.c70" : "primary.c70"}>
        {t("account.delegation.addDelegation")}
      </Text>
    </TouchableOpacity>
  );
}
