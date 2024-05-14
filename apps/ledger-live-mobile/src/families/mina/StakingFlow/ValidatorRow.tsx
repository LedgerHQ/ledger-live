import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Text, Flex, Box } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import CheckCircle from "~/icons/CheckCircle";
import type { ValidatorInfo } from "@ledgerhq/live-common/families/mina/types";

const truncateAddress = (address: string, startLength = 10, endLength = 10): string => {
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

type Props = {
  validator: ValidatorInfo;
  onSelect: () => void;
  isSelected: boolean;
};

export default function ValidatorRow({ validator, onSelect, isSelected }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("mina");

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        isSelected && { borderColor: colors.primary, borderWidth: 2 },
      ]}
      onPress={onSelect}
    >
      <Flex flexDirection="row" alignItems="flex-start" justifyContent="space-between">
        <Box flex={1}>
          {/* Validator name - most important */}
          <Text variant="h5" fontWeight="semiBold" color="neutral.c100" mb={2}>
            {validator.identityName || validator.name}
          </Text>

          {/* Fee - second most important */}
          <Text variant="small" fontWeight="medium" color="neutral.c90" mb={3}>
            {validator.fee}% {t("common.fee")}
          </Text>

          {/* Address - less important, smaller and copiable */}
          <Box mb={2}>
            <Text variant="small" color="neutral.c70">
              {truncateAddress(validator.address)}
            </Text>
          </Box>

          {/* Stats - least important, smallest */}
          <Box>
            <Text variant="small" color="neutral.c70" mb={1}>
              {validator.delegations} {t("mina.delegators")}
            </Text>
            <Text variant="small" color="neutral.c70">
              {t("common.stake")}: {validator.stake} {currency.units[0].code}
            </Text>
          </Box>
        </Box>

        {/* Selection indicator */}
        {isSelected && (
          <Box style={styles.checkContainer}>
            <CheckCircle size={24} color={colors.primary} />
          </Box>
        )}
      </Flex>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  checkContainer: {
    paddingTop: 4,
    paddingLeft: 8,
  },
  copyLink: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
});
