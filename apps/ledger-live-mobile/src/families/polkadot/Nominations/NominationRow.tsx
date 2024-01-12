import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import {
  PolkadotNomination,
  PolkadotValidator,
} from "@ledgerhq/live-common/families/polkadot/types";
import { Account } from "@ledgerhq/types-live";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";

import { useTheme } from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import LText from "~/components/LText";
import ArrowRight from "~/icons/ArrowRight";
import FirstLetterIcon from "~/components/FirstLetterIcon";

type Props = {
  nomination: PolkadotNomination;
  validator?: PolkadotValidator;
  account: Account;
  onPress: (nomination: PolkadotNomination) => void;
  isLast?: boolean;
};

export default function NominationRow({ nomination, validator, account, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { value, address, status } = nomination;
  const name = validator?.identity || address;
  // const total = validator?.totalBonded ?? null;
  // const commission = validator?.commission ?? null;

  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);

  return (
    <TouchableOpacity onPress={() => onPress(nomination)}>
      <Flex flexDirection={"row"} alignItems={"center"} py={5}>
        <View style={styles.icon}>
          <FirstLetterIcon label={validator?.identity || "-"} />
        </View>

        <View style={styles.nameWrapper}>
          <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1} pb={2}>
            {name}
          </Text>

          <View style={styles.statusWrapper}>
            {status === "active" && (
              <LText color={colors.success.c50} numberOfLines={1}>
                {t("polkadot.nomination.active")}
              </LText>
            )}
            {status === "inactive" && (
              <LText color={colors.neutral.c70} numberOfLines={1}>
                {t("polkadot.nomination.inactive")}
              </LText>
            )}
            {status === "waiting" && (
              <LText color={colors.neutral.c70} numberOfLines={1}>
                {t("polkadot.nomination.waiting")}
              </LText>
            )}
            {!status && (
              <LText color={colors.warning.c50} numberOfLines={1}>
                {t("polkadot.nomination.notValidator")}
              </LText>
            )}
            <View style={[styles.seeMore, { borderLeftColor: colors.neutral.c70 }]}>
              <LText style={styles.seeMoreText} color={colors.primary.c80}>
                {t("common.seeMore")}
              </LText>
              <ArrowRight color={colors.primary.c80} size={14} />
            </View>
          </View>
        </View>

        {status === "active" || status === "inactive" ? (
          <View style={styles.rightWrapper}>
            <Text variant={"large"} fontWeight={"semiBold"} color={"neutral.c100"}>
              <CurrencyUnitValue value={value} unit={unit} />
            </Text>

            <Text variant={"paragraph"} fontWeight={"medium"} color={"neutral.c80"}>
              <CounterValue
                currency={currency}
                showCode
                value={value}
                alwaysShowSign={false}
                withPlaceholder
              />
            </Text>
          </View>
        ) : null}
      </Flex>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  statusWrapper: {
    flex: 1,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  rightWrapper: {
    alignItems: "flex-end",
  },
  seeMore: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
  },
  seeMoreText: {
    fontSize: 14,
    textAlignVertical: "top",
  },
});
