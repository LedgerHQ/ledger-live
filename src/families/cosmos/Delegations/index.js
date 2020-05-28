// @flow
import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useMemo } from "react";
import type { ElementProps } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import {
  useCosmosMappedDelegations,
  useCosmosPreloadData,
} from "@ledgerhq/live-common/lib/families/cosmos/react";
import type {
  CosmosMappedDelegation,
  CosmosMappedUnbonding,
} from "@ledgerhq/live-common/lib/families/cosmos/types";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { mapUnbondings } from "@ledgerhq/live-common/lib/families/cosmos/utils";
import AccountDelegationInfo from "../../../components/AccountDelegationInfo";
import IlluRewards from "../../../components/IlluRewards";
import { urls } from "../../../config/urls";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import DelegationDrawer, {
  styles as drawerStyles,
} from "../../../components/DelegationDrawer";
import type { IconProps } from "../../../components/DelegationDrawer";
import Touchable from "../../../components/Touchable";
import colors, { rgba } from "../../../colors";
import { ScreenName, NavigatorName } from "../../../const";
import Circle from "../../../components/Circle";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import FirstLetterIcon from "../../../components/FirstLetterIcon";
import DelegateIcon from "../../../icons/Delegate";
import RedelegateIcon from "../../../icons/Redelegate";
import UndelegateIcon from "../../../icons/Undelegate";
import ClaimRewardIcon from "../../../icons/ClaimReward";
import DelegationRow from "./Row";
import DelegationLabelRight from "./LabelRight";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";

type Props = {
  account: Account,
};

type DelegationDrawerProps = ElementProps<typeof DelegationDrawer>;
type DelegationDrawerActions = $PropertyType<DelegationDrawerProps, "actions">;

export default function Delegations({ account }: Props) {
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account);
  const delegations: CosmosMappedDelegation[] = useCosmosMappedDelegations(
    mainAccount,
  );

  const currency = getAccountCurrency(mainAccount);
  const unit = getAccountUnit(mainAccount);
  const navigation = useNavigation();

  const { validators } = useCosmosPreloadData();

  const { cosmosResources } = mainAccount;

  const undelegations =
    cosmosResources &&
    cosmosResources.unbondings &&
    mapUnbondings(cosmosResources.unbondings, validators, unit);

  const [delegation, setDelegation] = useState<?CosmosMappedDelegation>();
  const [undelegation, setUndelegation] = useState<?CosmosMappedUnbonding>();

  const totalRewardsAvailable = delegations.reduce(
    (sum, d) => sum.plus(d.pendingRewards || 0),
    BigNumber(0),
  );

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: $Values<typeof NavigatorName> | $Values<typeof ScreenName>,
      screen?: $Values<typeof ScreenName>,
      params?: { [key: string]: any },
    }) => {
      setDelegation();
      navigation.navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onDelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CosmosDelegationFlow,
      screen: ScreenName.CosmosDelegationStarted,
    });
  }, [onNavigate]);

  const onRedelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CosmosRedelegationFlow,
      screen: ScreenName.CosmosRedelegationValidator,
      params: {
        accountId: account.id,
        validatorSrcAddress: delegation?.validatorAddress,
      },
    });
  }, [onNavigate, delegation, account]);

  const onCollectRewards = useCallback(() => {
    onNavigate({
      route: NavigatorName.CosmosClaimRewardsFlow,
      screen: delegation
        ? ScreenName.CosmosClaimRewardsMethod
        : ScreenName.CosmosClaimRewardsValidator,
      params: delegation
        ? {
            validator: delegation.validator,
            value: delegation.pendingRewards,
          }
        : {},
    });
  }, [onNavigate, delegation]);

  const onUndelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CosmosUndelegationFlow,
      screen: ScreenName.CosmosUndelegationAmount,
      params: {
        accountId: account.id,
        delegation,
      },
    });
  }, [onNavigate, delegation, account]);

  const onCloseDrawer = useCallback(() => {
    setDelegation();
    setUndelegation();
  }, []);

  const onOpenExplorer = useCallback(() => {
    const url = getAddressExplorer(
      getDefaultExplorerView(account.currency),
      delegation?.validatorAddress ?? "",
    );
    if (url) Linking.openURL(url);
  }, [account.currency, delegation]);

  const data = useMemo<$PropertyType<DelegationDrawerProps, "data">>(() => {
    const d = delegation || undelegation;
    return d
      ? [
          {
            label: t("delegation.validator"),
            Component: d.validator?.name ?? d.validatorAddress ?? "",
          },
          {
            label: t("delegation.validatorAddress"),
            Component: () => {
              return (
                <Touchable
                  onPress={onOpenExplorer}
                  event="DelegationOpenExplorer"
                >
                  <LText
                    numberOfLines={1}
                    semiBold
                    ellipsizeMode="middle"
                    style={[
                      drawerStyles.valueText,
                      drawerStyles.valueTextTouchable,
                    ]}
                  >
                    {d.validatorAddress}
                  </LText>
                </Touchable>
              );
            },
          },
          {
            label: t("delegation.delegatedAccount"),
            Component: account.name,
          },
          {
            label: t("cosmos.delegation.drawer.status"),
            Component:
              d.status === "bonded"
                ? t("cosmos.delegation.drawer.active")
                : t("cosmos.delegation.drawer.inactive"),
          },
          ...(delegation
            ? [
                {
                  label: t("cosmos.delegation.drawer.rewards"),
                  Component: delegation.formattedPendingRewards ?? "",
                },
              ]
            : []),
        ]
      : [];
  }, [delegation, t, account, onOpenExplorer, undelegation]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    const rewardsDisabled =
      !delegation ||
      !delegation.pendingRewards ||
      delegation.pendingRewards.isZero();
    return delegation
      ? [
          {
            label: t("delegation.actions.delegate"),
            Icon: (props: IconProps) => (
              <Circle {...props} bg={colors.fog}>
                <DelegateIcon />
              </Circle>
            ),
            onPress: onDelegate,
            event: "DelegationActionDelegate",
          },
          {
            label: t("delegation.actions.redelegate"),
            Icon: (props: IconProps) => (
              <Circle {...props} bg={colors.fog}>
                <RedelegateIcon />
              </Circle>
            ),
            onPress: onRedelegate,
            event: "DelegationActionRedelegate",
          },
          {
            label: t("delegation.actions.collectRewards"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={
                  rewardsDisabled ? colors.lightFog : rgba(colors.yellow, 0.2)
                }
              >
                <ClaimRewardIcon
                  color={rewardsDisabled ? colors.grey : undefined}
                />
              </Circle>
            ),
            disabled: rewardsDisabled,
            onPress: onCollectRewards,
            event: "DelegationActionCollectRewards",
          },
          {
            label: t("delegation.actions.undelegate"),
            Icon: (props: IconProps) => (
              <Circle {...props} bg={rgba(colors.alert, 0.2)}>
                <UndelegateIcon />
              </Circle>
            ),
            onPress: onUndelegate,
            event: "DelegationActionUndelegate",
          },
        ]
      : [];
  }, [t, onDelegate, onRedelegate, onCollectRewards, onUndelegate, delegation]);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <FirstLetterIcon
            label={
              (delegation || undelegation)?.validator?.name ??
              (delegation || undelegation)?.validatorAddress ??
              ""
            }
            round
            size={size}
            fontSize={24}
          />
        )}
        // TODO Check CosmosMappedDelegation type
        amount={delegation?.amount ?? BigNumber(0)}
        data={data}
        actions={actions}
      />
      {totalRewardsAvailable.gt(0) && (
        <>
          <AccountSectionLabel name={t("account.claimReward.sectionLabel")} />
          <View style={styles.rewardsWrapper}>
            <View style={styles.column}>
              <LText semiBold style={styles.label}>
                <CurrencyUnitValue value={totalRewardsAvailable} unit={unit} />
              </LText>
              <LText tertiary style={styles.subLabel}>
                <CounterValue
                  currency={currency}
                  value={totalRewardsAvailable}
                  withPlaceholder
                />
              </LText>
            </View>
            <Button
              event="Cosmos AccountClaimRewardsBtn Click"
              onPress={onCollectRewards}
              type="primary"
              title={t("account.claimReward.cta")}
            />
          </View>
        </>
      )}

      {delegations.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("tron.voting.delegationEarn", {
            name: account.currency.name,
          })}
          infoUrl={urls.tronStaking}
          infoTitle={t("tron.voting.howItWorks")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("account.delegation.sectionLabel")}
            RightComponent={<DelegationLabelRight onPress={onDelegate} />}
          />
          {delegations.map((d, i) => (
            <View style={styles.delegationsWrapper}>
              <DelegationRow
                delegation={d}
                currency={currency}
                onPress={() => setDelegation(d)}
                isLast={i === delegations.length - 1}
              />
            </View>
          ))}
        </View>
      )}

      {undelegations && undelegations.length > 0 && (
        <View style={styles.wrapper}>
          <AccountSectionLabel name={t("account.undelegation.sectionLabel")} />
          {undelegations.map((d, i) => (
            <View style={styles.delegationsWrapper}>
              <DelegationRow
                delegation={d}
                currency={currency}
                onPress={() => setUndelegation(d)}
                isLast={i === undelegations.length - 1}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    margin: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  rewardsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  subLabel: {
    fontSize: 14,
    color: colors.grey,
    flex: 1,
  },
  column: {
    flexDirection: "column",
  },
  wrapper: {
    marginBottom: 16,
  },
  delegationsWrapper: {
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  actionColor: {
    color: colors.live,
  },
});
