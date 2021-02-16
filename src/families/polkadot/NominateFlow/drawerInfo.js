import React from "react";
import { View, StyleSheet } from "react-native";

import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";

import { useTheme } from "@react-navigation/native";
import Touchable from "../../../components/Touchable";
import LText from "../../../components/LText";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import ExternalLink from "../../../icons/ExternalLink";

import NominationDrawer from "../components/NominationDrawer";

type NominationDrawerData = $PropertyType<
  ElementProps<typeof NominationDrawer>,
  "data",
>;

export function getDrawerInfo({
  t,
  account,
  validator,
  maxNominatorRewardedPerValidator,
  onOpenExplorer,
}): NominationDrawerData {
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);

  const totalStake = validator.totalBonded;
  const formattedCommission = validator.commission
    ? `${validator.commission.multipliedBy(100).toFixed(2)} %`
    : "-";
  const validatorStatus = validator.isElected ? "elected" : "waiting";

  return [
    ...(validator.identity
      ? [
          {
            label: t("delegation.validator"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={styles.valueText}
              >
                {validator.identity}
              </LText>
            ),
          },
        ]
      : []),
    {
      label: t("delegation.validatorAddress"),
      Component: () => {
        const { colors } = useTheme();
        return (
          <Touchable
            onPress={() => onOpenExplorer(validator.address)}
            event="NominationOpenExplorer"
          >
            <LText
              numberOfLines={1}
              semiBold
              ellipsizeMode="middle"
              style={[styles.valueText]}
              color="live"
            >
              {validator.address}
              <View style={styles.iconContainer}>
                <ExternalLink size={14} color={colors.live} />
              </View>
            </LText>
          </Touchable>
        );
      },
    },
    {
      label: t("polkadot.nomination.status"),
      info: t(`polkadot.nomination.${validatorStatus}Info`),
      Component: (
        <LText
          numberOfLines={1}
          semiBold
          ellipsizeMode="middle"
          style={[styles.valueText]}
          color={validator.isElected ? "live" : "darkBlue"}
        >
          {t(`polkadot.nomination.${validatorStatus}`)}
        </LText>
      ),
    },
    ...(validator.status
      ? [
          {
            label: t("polkadot.nomination.commission"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={styles.valueText}
              >
                {formattedCommission}
              </LText>
            ),
          },
        ]
      : []),
    ...(validator.isElected
      ? [
          {
            label: t("polkadot.nomination.nominators"),
            info: validator.isOversubscribed
              ? t("polkadot.nomination.oversubscribedInfo", {
                  maxNominatorRewardedPerValidator,
                })
              : t("polkadot.nomination.nominatorsInfo", {
                  count: validator.nominatorsCount,
                }),
            infoType: validator.isOversubscribed ? "warning" : "info",
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color={validator.isOversubscribed ? "orange" : "darkBlue"}
              >
                {validator.isOversubscribed
                  ? t("polkadot.nomination.oversubscribed", {
                      nominatorsCount: validator.nominatorsCount,
                    })
                  : t("polkadot.nomination.nominatorsCount", {
                      nominatorsCount: validator.nominatorsCount,
                    })}
              </LText>
            ),
          },
          {
            label: t("polkadot.nomination.totalStake"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={styles.valueText}
              >
                <View style={styles.column}>
                  <LText semiBold>
                    <CurrencyUnitValue value={totalStake} unit={unit} />
                  </LText>
                  {totalStake ? (
                    <LText style={styles.valueCounterValue} color="grey">
                      <CounterValue
                        currency={currency}
                        value={totalStake}
                        withPlaceholder
                      />
                    </LText>
                  ) : null}
                </View>
              </LText>
            ),
          },
        ]
      : []),
  ];
}

const styles = StyleSheet.create({
  column: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 14,
  },
  valueCounterValue: {
    fontSize: 14,
    flex: 1,
  },
  iconContainer: {
    paddingLeft: 6,
  },
});
