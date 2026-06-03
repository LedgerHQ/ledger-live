import { Text } from "@ledgerhq/native-ui";
import React from "react";
import { TouchableOpacity } from "react-native";

type Props = Readonly<{
  disabled?: boolean;
  onPress: () => void;
  label: string;
}>;

export default function DelegationLabelRight({ onPress, disabled, label }: Props) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text fontWeight="semiBold" color={disabled ? "grey" : "live"}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
