import React from "react";
import { useTheme } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import Touchable from "~/components/Touchable";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import ArrowRight from "~/icons/ArrowRight";

const AVATAR_SIZE = 42;

type Props = {
  label: string;
  amount: React.ReactNode;
  /** Second line on the right: counter value for a stake, unbonding status for an unstake. */
  sub: React.ReactNode;
  statusIcon?: React.ReactNode;
  event: string;
  testID: string;
  onPress: () => void;
};

export default function StakingRow({
  label,
  amount,
  sub,
  statusIcon,
  event,
  testID,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Touchable onPress={onPress} event={event} testID={testID}>
      <Flex flexDirection="row" alignItems="center" py={4}>
        <Circle crop size={AVATAR_SIZE}>
          <FirstLetterIcon label={label} round size={AVATAR_SIZE} fontSize={24} />
        </Circle>

        <Flex flex={1} ml={4} mr={4}>
          <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
            {label}
          </Text>
          <Flex flexDirection="row" alignItems="center">
            <Text variant="small" color="primary.c80" mr={1}>
              {t("common.seeMore")}
            </Text>
            <ArrowRight color={colors.primary} size={14} />
          </Flex>
        </Flex>

        <Flex alignItems="flex-end" flexShrink={0}>
          <Flex flexDirection="row" alignItems="center">
            {statusIcon}
            <Text
              variant="body"
              fontWeight="semiBold"
              numberOfLines={1}
              testID={`${testID}-amount`}
            >
              {amount}
            </Text>
          </Flex>
          <Text variant="small" color="neutral.c70" numberOfLines={1} testID={`${testID}-sub`}>
            {sub}
          </Text>
        </Flex>
      </Flex>
    </Touchable>
  );
}
