import React from "react";
import { Flex, Text, Icons, Box } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";

type Props = {
  onPress?: () => void;
  title: React.ReactNode;
  value: React.ReactNode;
  warning?: boolean;
  isLast?: boolean;
};

export default function BalanceSummaryInfoItem({
  onPress,
  title,
  value,
  warning = false,
  isLast = false,
}: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Box
        flexBasis={"auto"}
        flexDirection={"column"}
        pr={7}
        mr={7}
        py={5}
        borderRightColor={"neutral.c40"}
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
                <Icons.WarningMedium size={16} color={"warning.c30"} />
              ) : (
                <Icons.InfoMedium size={16} color={"neutral.c70"} />
              )}
            </>
          )}
        </Flex>
        <Text variant={"large"} fontWeight={"medium"} color={"neutral.c100"}>
          {value}
        </Text>
      </Box>
    </TouchableOpacity>
  );
}
