import React from "react";
import { View, StyleSheet } from "react-native";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useTheme } from "@react-navigation/native";
import type { TFunction } from "i18next";
import type { AccountLike } from "@ledgerhq/types-live";
import type { PolkadotValidator } from "@ledgerhq/live-common/families/polkadot/types";
import Touchable from "~/components/Touchable";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import ExternalLink from "~/icons/ExternalLink";
import NominationDrawer from "../components/NominationDrawer";
import { Unpacked } from "~/types/helpers";

type NominationDrawerData = React.ComponentProps<typeof NominationDrawer>["data"];
type NominationDrawerDatum = Unpacked<NominationDrawerData>;

type Props = {
  t: TFunction;
  account: AccountLike;
  validator: PolkadotValidator;
  maxNominatorRewardedPerValidator: number;
  onOpenExplorer: (address: string) => void;
};

export function getDrawerInfo({
  t,
  account,
  validator,
  maxNominatorRewardedPerValidator,
  onOpenExplorer,
}: Props): NominationDrawerData {
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const totalStake = validator.totalBonded;
  const formattedCommission = validator.commission
    ? `${validator.commission.multipliedBy(100).toFixed(2)} %`
    : "-";
  const validatorStatus = validator.isElected ? "elected" : "waiting";

  const drawerData: NominationDrawerData = [
    {
      label: t("delegation.validatorAddress") as string,
      Component: (() => {
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
      })(),
    },
    {
      label: t("polkadot.nomination.status") as string,
      info: t(`polkadot.nomination.${validatorStatus}Info`) as string,
      Component: (
        <LText
          numberOfLines={1}
          semiBold
          ellipsizeMode="middle"
          style={[styles.valueText]}
          color={validator.isElected ? "live" : "darkBlue"}
        >
          {t(`polkadot.nomination.${validatorStatus}`) as string}
        </LText>
      ),
    },
  ];

  const delegationValidator: NominationDrawerDatum = {
    label: t("delegation.validator") as string,
    Component: (
      <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.valueText}>
        {validator.identity}
      </LText>
    ),
  };

  const nominationComission: NominationDrawerDatum = {
    label: t("polkadot.nomination.commission") as string,
    Component: (
      <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.valueText}>
        {formattedCommission}
      </LText>
    ),
  };

  const nominationNominators: NominationDrawerDatum = {
    label: t("polkadot.nomination.nominators") as string,
    info: validator.isOversubscribed
      ? (t("polkadot.nomination.oversubscribedInfo", {
          maxNominatorRewardedPerValidator,
        }) as string)
      : (t("polkadot.nomination.nominatorsInfo", {
          count: validator.nominatorsCount,
        }) as string),
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
          ? (t("polkadot.nomination.oversubscribed", {
              nominatorsCount: validator.nominatorsCount,
            }) as string)
          : (t("polkadot.nomination.nominatorsCount", {
              nominatorsCount: validator.nominatorsCount,
            }) as string)}
      </LText>
    ),
  };

  const nominationTotalStake: NominationDrawerDatum = {
    label: t("polkadot.nomination.totalStake") as string,
    Component: (
      <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.valueText}>
        <View style={styles.column}>
          <LText semiBold>
            <CurrencyUnitValue value={totalStake} unit={unit} />
          </LText>
          {totalStake ? (
            <LText style={styles.valueCounterValue} color="grey">
              <CounterValue currency={currency} value={totalStake} withPlaceholder />
            </LText>
          ) : null}
        </View>
      </LText>
    ),
  };

  return [
    ...drawerData,
    ...(validator.identity ? [delegationValidator] : []),
    // FIXME: what the heck is this status field?
    ...((validator as unknown as { status: boolean }).status ? [nominationComission] : []),
    ...(validator.isElected ? [nominationNominators, nominationTotalStake] : []),
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
