import React from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import Touchable from "~/components/Touchable";
import Skeleton from "~/components/Skeleton";
import ArrowRight from "~/icons/ArrowRight";
import ValidatorImage from "./ValidatorImage";

const AVATAR_SIZE = 42;

type Props = Readonly<{
  label: string;
  amount: React.ReactNode;
  subtitle: React.ReactNode;
  statusIcon?: React.ReactNode;
  loading?: boolean;
  event: string;
  testID: string;
  onPress: () => void;
}>;

export default function StakingRow({
  label,
  amount,
  subtitle,
  statusIcon,
  loading = false,
  event,
  testID,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Touchable onPress={onPress} event={event} testID={testID}>
      <Flex flexDirection="row" alignItems="center" py={4}>
        <Skeleton loading={loading} style={styles.avatarSkeleton}>
          <ValidatorImage label={label} size={AVATAR_SIZE} />
        </Skeleton>

        <Flex flex={1} ml={4} mr={4}>
          <Skeleton loading={loading} style={styles.labelSkeleton}>
            <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
              {label}
            </Text>
          </Skeleton>
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
            {subtitle}
          </Text>
        </Flex>
      </Flex>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  avatarSkeleton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  labelSkeleton: {
    width: 110,
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
});
