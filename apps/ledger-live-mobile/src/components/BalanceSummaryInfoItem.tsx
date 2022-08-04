import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Info from "../icons/Info";
import LText from "./LText";
import styled from "@ledgerhq/native-ui/components/styled";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";

type Props = {
  onPress?: () => void;
  title: React.ReactNode;
  value: React.ReactNode;
  warning?: boolean;
  isLast?: boolean;
};

const StyledTouchableOpacity = styled.TouchableOpacity.attrs({
  flexBasis: "auto",
  flexDirection: "column",
  mr: 7,
  py: 5,
  borderRightColor: "neutral.c40",
})``;

export default function BalanceSummaryInfoItem({
  onPress,
  title,
  value,
  warning = false,
  isLast = false,
}: Props) {
  return (
    <StyledTouchableOpacity
      onPress={onPress}
      pr={isLast ? 0 : 7}
      borderRightWidth={isLast ? 0 : 1}
    >
      <Flex flexDirection={"row"} alignItems={"center"}>
        <Text
          variant={"small"}
          fontWeight={"medium"}
          color={"neutral.c70"}
          mr={2}
        >
          {title}
        </Text>
        {onPress && (
          <>
            {warning ? (
              <Icons.WarningMedium size={16} color={"warning.c60"} />
            ) : (
              <Icons.InfoMedium size={16} color={"neutral.c70"} />
            )}
          </>
        )}
      </Flex>
      <Text variant={"large"} fontWeight={"medium"} color={"neutral.c100"}>
        {value}
      </Text>
    </StyledTouchableOpacity>
  );
}
