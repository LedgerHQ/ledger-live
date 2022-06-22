import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useMemo , ElementProps } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
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
import {
  mapUnbondings,
  canRedelegate,
  getRedelegation,
  canUndelegate,
  canDelegate,
} from "@ledgerhq/live-common/lib/families/cosmos/logic";
import { Text } from "@ledgerhq/native-ui";
import AccountDelegationInfo from "../../../components/AccountDelegationInfo";
import IlluRewards from "../../../icons/images/Rewards";
import { urls } from "../../../config/urls";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import DelegationDrawer from "../../../components/DelegationDrawer";
import type { IconProps } from "../../../components/DelegationDrawer";
import Touchable from "../../../components/Touchable";
import { rgba } from "../../../colors";
import { ScreenName, NavigatorName } from "../../../const";
import Circle from "../../../components/Circle";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import RedelegateIcon from "../../../icons/Redelegate";
import UndelegateIcon from "../../../icons/Undelegate";
import ClaimRewardIcon from "../../../icons/ClaimReward";
import DelegationRow from "./Row";
import DelegationLabelRight from "./LabelRight";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import DateFromNow from "../../../components/DateFromNow";
import ValidatorImage from "../shared/ValidatorImage";
import { LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/lib/families/cosmos/utils";

type Props = {
  account: Account,
};

type DelegationDrawerProps = ElementProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: Props) {
  const { colors } = useTheme();
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

  const [delegation, setDelegation] = useState<CosmosMappedDelegation>();
  const [undelegation, setUndelegation] = useState<CosmosMappedUnbonding>();

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
      route: typeof NavigatorName | typeof ScreenName,
      screen?: typeof ScreenName,
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
      screen: delegations.length > 0 ? ScreenName.CosmosDelegationValidator : ScreenName.CosmosDelegationStarted,
    });
  }, [onNavigate, delegations]);

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

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    const d = delegation || undelegation;

    const redelegation = delegation && getRedelegation(account, delegation);

    return d
      ? [
          {
            label: t("delegation.validator"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {d.validator?.name ?? d.validatorAddress ?? ""}
              </LText>
            ),
          },
          {
            label: t("delegation.validatorAddress"),
            Component: (
              <Touchable
                onPress={() => onOpenExplorer(d.validatorAddress)}
                event="DelegationOpenExplorer"
              >
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {d.validatorAddress}
                </LText>
              </Touchable>
            ),
          },
          {
            label: t("delegation.delegatedAccount"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {account.name}{" "}
              </LText>
            ),
          },
          {
            label: t("cosmos.delegation.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {d.status === "bonded"
                  ? t("cosmos.delegation.drawer.active")
                  : t("cosmos.delegation.drawer.inactive")}
              </LText>
            ),
          },
          ...(delegation
            ? [
                {
                  label: t("cosmos.delegation.drawer.rewards"),
                  Component: (
                    <LText
                      numberOfLines={1}
                      semiBold
                      style={[styles.valueText]}
                    >
                      {delegation.formattedPendingRewards ?? ""}
                    </LText>
                  ),
                },
              ]
            : []),
          ...(undelegation
            ? [
                {
                  label: t("cosmos.delegation.drawer.completionDate"),
                  Component: (
                    <LText numberOfLines={1} semiBold>
                      <DateFromNow
                        date={new Date(undelegation.completionDate).getTime()}
                      />
                    </LText>
                  ),
                },
              ]
            : []),
          ...(redelegation
            ? [
                {
                  label: t("cosmos.delegation.drawer.redelegatedFrom"),
                  Component: (
                    <Touchable
                      onPress={() =>
                        onOpenExplorer(redelegation.validatorSrcAddress)
                      }
                      event="DelegationOpenExplorer"
                    >
                      <LText
                        numberOfLines={1}
                        semiBold
                        ellipsizeMode="middle"
                        style={[styles.valueText]}
                        color="live"
                      >
                        {redelegation.validatorSrcAddress}
                      </LText>
                    </Touchable>
                  ),
                },
                {
                  label: t("cosmos.delegation.drawer.completionDate"),
                  Component: (
                    <LText numberOfLines={1} semiBold>
                      <DateFromNow
                        date={new Date(redelegation.completionDate).getTime()}
                      />
                    </LText>
                  ),
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

    const redelegateEnabled = delegation && canRedelegate(account, delegation);

    const undelegationEnabled = canUndelegate(account);

    return delegation
      ? [
          {
            label: t("delegation.actions.redelegate"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={!redelegateEnabled ? colors.lightFog : colors.fog}
              >
                <RedelegateIcon
                  color={!redelegateEnabled ? colors.grey : undefined}
                />
              </Circle>
            ),
            disabled: !redelegateEnabled,
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
              <Circle
                {...props}
                bg={
                  !undelegationEnabled
                    ? colors.lightFog
                    : rgba(colors.alert, 0.2)
                }
              >
                <UndelegateIcon
                  color={!undelegationEnabled ? colors.grey : undefined}
                />
              </Circle>
            ),
            disabled: !undelegationEnabled,
            onPress: onUndelegate,
            event: "DelegationActionUndelegate",
          },
        ]
      : [];
  }, [delegation, account, t, onRedelegate, onCollectRewards, onUndelegate, colors.lightFog, colors.fog, colors.grey, colors.yellow, colors.alert]);

  const delegationDisabled = delegations.length <= 0 || !canDelegate(account);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage
            isLedger={(delegation || undelegation)?.validatorAddress === LEDGER_VALIDATOR_ADDRESS}
            name={
              (delegation || undelegation)?.validator?.name ??
              (delegation || undelegation)?.validatorAddress ??
              ""
            }
            size={size}
          />
        )}
        amount={delegation?.amount ?? new BigNumber(0)}
        data={data}
        actions={actions}
      />
      {totalRewardsAvailable.gt(0) && (
        <>
          <AccountSectionLabel name={t("account.claimReward.sectionLabel")} />
          <View
            style={[styles.rewardsWrapper]}
          >
            <View style={styles.column}>
              <Text fontWeight={'semiBold'} variant={'h4'}>
                <CurrencyUnitValue value={totalRewardsAvailable} unit={unit} />
              </Text>
              <LText semiBold style={styles.subLabel} color="grey">
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
          description={t("cosmos.delegation.delegationEarn", {
            name: account.currency.name,
          })}
          infoUrl={urls.cosmosStaking}
          infoTitle={t("cosmos.delegation.info")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("account.delegation.sectionLabel")}
            RightComponent={
              <DelegationLabelRight
                disabled={delegationDisabled}
                onPress={onDelegate}
              />
            }
          />
          {delegations.map((d, i) => (
            <View
              key={d.validatorAddress}
              style={[
                styles.delegationsWrapper,
              ]}
            >
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
            <View
              key={d.validatorAddress}
              style={[
                styles.delegationsWrapper,
                { backgroundColor: colors.card },
              ]}
            >
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

export default function CosmosDelegations({ account }: Props) {
  if (!account.cosmosResources) return null;
  return <Delegations account={account} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  rewardsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    paddingVertical: 16,
    marginBottom: 16,

    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  subLabel: {
    fontSize: 14,

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
  },
  valueText: {
    fontSize: 14,
  },
});
